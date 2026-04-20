import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
admin.initializeApp({
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
});

const db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);
const bucket = admin.storage().bucket();

const collections = {
    users: 'users',
    withdrawals: 'withdrawals',
    vip_requests: 'vip_requests',
    enquiries: 'enquiries',
    ad_rewards: 'ad_rewards',
    referral_earnings: 'referral_earnings',
};

const isAdmin = (userData: any) => {
  if (!userData) return false;
  return userData.role === 'admin' || 
         userData.phone === 'ashishnehra450@gmail.com' || 
         userData.uid === 'ashishnehra450@gmail.com' || 
         userData.email === 'ashishnehra450@gmail.com';
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API: Reward user for watching ad
  app.post('/api/reward', async (req, res) => {
    const { uid, adNetwork } = req.body;
    if (!uid) return res.status(400).json({ error: 'UID required' });

    try {
      const userRef = db.collection(collections.users).doc(uid);
      const userDoc = await userRef.get();
      if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
      
      const userData = userDoc.data();
      const rewardAmount = 0.01;
      const newBalance = (userData?.balance || 0) + rewardAmount;
      
      await userRef.update({ balance: newBalance });
      
      await db.collection(collections.ad_rewards).add({
        uid,
        amount: rewardAmount,
        adNetwork: adNetwork || 'unknown',
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, reward: 0.01 });
    } catch (error: any) {
      console.error('Reward error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Admin Approve Withdrawal
  app.post('/api/admin/approve', async (req, res) => {
    const { withdrawalId, adminUid } = req.body;
    
    try {
      const adminDoc = await db.collection(collections.users).doc(adminUid).get();
      if (!adminDoc.exists || !isAdmin(adminDoc.data())) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const wRef = db.collection(collections.withdrawals).doc(withdrawalId);
      const wDoc = await wRef.get();
      if (!wDoc.exists) throw new Error('Withdrawal not found');
      
      const wData = wDoc.data();
      if (wData?.status !== 'pending') throw new Error('Already processed');

      const uid = wData.uid;
      const amount = wData.amount;
      
      // Fetch global settings for commission
      let commissionRate = 0.1; // Default 10%
      try {
        const settingsDoc = await db.collection('settings').doc('global').get();
        if (settingsDoc.exists) {
          const settings = settingsDoc.data();
          if (settings && typeof settings.commission === 'number') {
            commissionRate = settings.commission / 100;
          }
        }
      } catch (e) {
        console.error('Error fetching settings for commission:', e);
      }

      const netPayout = amount * (1 - commissionRate);

      await wRef.update({ 
        status: 'approved', 
        net_payout: netPayout,
        processedAt: new Date().toISOString()
      });

      const uRef = db.collection(collections.users).doc(uid);
      const uDoc = await uRef.get();
      const currentBalance = uDoc.data()?.balance || 0;
      if (currentBalance < amount) throw new Error('Insufficient balance');
      
      await uRef.update({ balance: currentBalance - amount });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Approval error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Admin Reject Withdrawal
  app.post('/api/admin/reject', async (req, res) => {
    const { withdrawalId, adminUid, reason } = req.body;
    
    try {
      const adminDoc = await db.collection(collections.users).doc(adminUid).get();
      if (!adminDoc.exists || !isAdmin(adminDoc.data())) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const wRef = db.collection(collections.withdrawals).doc(withdrawalId);
      const wDoc = await wRef.get();
      if (!wDoc.exists) throw new Error('Withdrawal not found');
      if (wDoc.data()?.status !== 'pending') throw new Error('Already processed');

      await wRef.update({ 
        status: 'rejected', 
        reason: reason || 'No reason provided',
        processedAt: new Date().toISOString()
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Rejection error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Request VIP Membership
  app.post('/api/vip/request', async (req, res) => {
    const { uid, userName, transactionId } = req.body;
    if (!uid || !transactionId) return res.status(400).json({ error: 'UID and Transaction ID required' });

    try {
      await db.collection(collections.vip_requests).add({
        uid,
        userName,
        transactionId,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error('VIP Request error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Admin Approve VIP Membership
  app.post('/api/admin/vip/approve', async (req, res) => {
    const { requestId, adminUid } = req.body;
    if (!requestId || !adminUid) return res.status(400).json({ error: 'Request ID and Admin UID required' });

    const REWARDS = [30, 20, 15, 10, 5]; // Levels 1 to 5

    try {
      const adminDoc = await db.collection(collections.users).doc(adminUid).get();
      if (!adminDoc.exists || !isAdmin(adminDoc.data())) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const rRef = db.collection(collections.vip_requests).doc(requestId);
      const rDoc = await rRef.get();
      if (!rDoc.exists) throw new Error('Request not found');
      if (rDoc.data()?.status !== 'pending') throw new Error('Already processed');

      const uid = rDoc.data()?.uid;
      const uRef = db.collection(collections.users).doc(uid);
      const uDoc = await uRef.get();
      const userData = uDoc.data();
      if (userData?.isVip) throw new Error('Already a VIP member');

      await uRef.update({ 
        isVip: true,
        vipPurchasedAt: new Date().toISOString()
      });

      await rRef.update({ 
        status: 'approved',
        processedAt: new Date().toISOString()
      });

      let currentReferrerId = userData?.referredBy;
      for (let level = 0; level < REWARDS.length; level++) {
        if (!currentReferrerId) break;

        try {
          const referrerRef = db.collection(collections.users).where('referralCode', '==', currentReferrerId).limit(1);
          const referrerSnap = await referrerRef.get();
          if (referrerSnap.empty) break;
          
          const referrerDoc = referrerSnap.docs[0];
          const referrerData = referrerDoc.data();
          const referrerId = referrerDoc.id;

          if (referrerData?.isVip) {
            const rewardAmount = REWARDS[level];
            await referrerDoc.ref.update({ 
              balance: (referrerData.balance || 0) + rewardAmount,
              totalReferralEarnings: (referrerData.totalReferralEarnings || 0) + rewardAmount
            });
            
            await db.collection(collections.referral_earnings).add({
              uid: referrerId,
              fromUid: uid,
              level: level + 1,
              amount: rewardAmount,
              timestamp: new Date().toISOString()
            });
          }
          currentReferrerId = referrerData?.referredBy;
        } catch (e) {
          break;
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('VIP Approval error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Admin Upload QR Code (Proxy to bypass client-side CORS/Retry limits)
  app.post('/api/admin/upload-qr', async (req, res) => {
    const { adminUid, base64Data, fileName } = req.body;
    if (!adminUid || !base64Data) return res.status(400).json({ error: 'Missing data' });

    try {
      const adminDoc = await db.collection(collections.users).doc(adminUid).get();
      if (!adminDoc.exists || !isAdmin(adminDoc.data())) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Extract base64 content
      const base64Content = base64Data.split(';base64,').pop();
      const buffer = Buffer.from(base64Content, 'base64');
      const file = bucket.file(`admin/payment_qr_${Date.now()}`);

      await file.save(buffer, {
        metadata: { contentType: req.body.contentType || 'image/png' },
      });

      // Instead of public: true (which can fail with Uniform Bucket-Level Access), 
      // we make it public explicitly if possible, or use a signed URL as fallback.
      try {
        await file.makePublic();
      } catch (aclError) {
        console.warn('ACL makePublic failed (likely Uniform Bucket-Level Access), using it without ACL...');
      }

      // Get public URL (standard GCS public URL format)
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
      
      // Update config
      await db.collection('settings').doc('global').set({ qrUrl: publicUrl }, { merge: true });

      console.log('QR Upload proxy completed successfully:', publicUrl);
      res.json({ success: true, url: publicUrl });
    } catch (error: any) {
      console.error('QR Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
