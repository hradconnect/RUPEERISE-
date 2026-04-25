import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_URL = 'https://htcmxldinazyjmgjynaj.supabase.co'.trim();
const DEFAULT_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Y214bGRpbmF6eWptZ2p5bmFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3NTMxNiwiZXhwIjoyMDkyMzUxMzE2fQ.eWv_bouaAD1FE6WjdAPFNg1xEaCRZZt5h_eRkuUpNy8'.trim();

const supabaseUrl = (process.env.VITE_SUPABASE_URL || DEFAULT_URL).trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_KEY).trim();

if (supabaseUrl === DEFAULT_URL && !process.env.VITE_SUPABASE_URL) {
  console.warn('Using default Supabase URL');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const collections = {
    users: 'users',
    withdrawals: 'withdrawals',
    vip_requests: 'vip_requests',
    enquiries: 'enquiries',
    ad_rewards: 'ad_rewards',
    referral_earnings: 'referral_earnings',
};

const getProp = (obj: any, propName: string) => {
  if (!obj) return undefined;
  if (obj[propName] !== undefined) return obj[propName];
  
  // Try snake_case
  const snakeCase = propName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  if (obj[snakeCase] !== undefined) return obj[snakeCase];
  
  // Try lowercase
  const lowerCase = propName.toLowerCase();
  if (obj[lowerCase] !== undefined) return obj[lowerCase];

  // Search all keys case-insensitively
  const keys = Object.keys(obj);
  const foundKey = keys.find(k => k.toLowerCase() === lowerCase);
  if (foundKey) return obj[foundKey];
  
  return undefined;
};

const isAdmin = (userData: any) => {
  if (!userData) return false;
  const adminIdentifier = 'ashishnehra450@gmail.com'.toLowerCase();
  const role = getProp(userData, 'role');
  const idValue = getProp(userData, 'id');
  const emailValue = getProp(userData, 'email');

  const result = (role === 'admin') || 
         (idValue && idValue.toString().toLowerCase() === adminIdentifier) || 
         (emailValue && emailValue.toLowerCase() === adminIdentifier);
  
  if (!result) {
    console.warn(`Admin access denied for user: ${emailValue || idValue} (Role: ${role})`);
  }
  return result;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '200mb' }));

  // API: Reward user for watching ad
  app.post('/api/reward', async (req, res) => {
    const { uid, adNetwork } = req.body;
    if (!uid) return res.status(400).json({ error: 'UID required' });

    // Validate UUID format to prevent Postgres casting errors
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid);
    if (!isUUID) {
      console.error('Invalid UID format provided:', uid);
      return res.status(400).json({ error: 'Invalid UID format' });
    }

    try {
      // Cooldown check: prevent rapid rewards (within 25s)
      const { data: recentReward, error: cooldownError } = await supabase
        .from('ad_rewards')
        .select('timestamp')
        .eq('uid', uid)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (cooldownError) {
        console.error('Cooldown fetch failed:', cooldownError.message || cooldownError);
      }

      if (recentReward && recentReward.length > 0) {
        const lastRewardTime = new Date(recentReward[0].timestamp).getTime();
        const now = new Date().getTime();
        if (now - lastRewardTime < 25000) {
          return res.status(429).json({ error: 'Cooldown active. Please wait.' });
        }
      }

      // Fetch only what we absolutely need for reward calculation
      let userProfileData: any = null;
      const { data: initialData, error: initialError } = await supabase
        .from('users')
        .select('*' as any) // Selecting all to avoid case-sensitivity issues with specific columns in select
        .eq('id', uid)
        .single();
      
      if (initialError || !initialData) {
        console.error('User fetch failed:', initialError);
        return res.status(404).json({ error: 'User not found' });
      }
      userProfileData = initialData;
      
      const isVipValue = getProp(userProfileData, 'isVip');
      const isVip = isVipValue === true || isVipValue === 'true' || isVipValue === 1 || isVipValue === '1';
      
      console.log(`Ad Reward Debug - UID: ${uid}, isVipValue: ${isVipValue}, isVip: ${isVip}`);
      
      const rewardAmount = isVip ? 0.02 : 0.01;
      const currentBalance = Number(getProp(userProfileData, 'balance')) || 0;
      const newBalance = currentBalance + rewardAmount;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', uid);
      
      if (updateError) {
        console.error('Balance update failed message:', updateError.message || updateError);
        throw updateError;
      }
      
      const { error: insertError } = await supabase
        .from('ad_rewards')
        .insert({
          uid,
          amount: rewardAmount,
          adNetwork: adNetwork || 'unknown'
        });
      
      if (insertError) {
        console.error('Reward log insert failed message:', insertError.message || insertError);
        // We don't throw here to ensure balance update still works even if logging fails
      }
      
      res.json({ success: true, reward: rewardAmount });
    } catch (error: any) {
      console.error('Reward API Catch-all:', {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      });
      res.status(500).json({ error: error.message || 'Internal reward processing error' });
    }
  });

  // API: Admin Approve Withdrawal
  app.post('/api/admin/approve', async (req, res) => {
    const { withdrawalId, adminUid } = req.body;
    
    try {
      const { data: adminData } = await supabase
        .from('users')
        .select('*')
        .eq('id', adminUid)
        .single();

      if (!adminData || !isAdmin(adminData)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { data: wData, error: wError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (wError || !wData) throw new Error('Withdrawal not found');
      if (wData.status !== 'pending') throw new Error('Already processed');

      const uid = wData.uid;
      const amount = wData.amount;
      
      // Fetch global settings for commission
      let commissionRate = 0.1; // Default 10%
      try {
        const { data: settings } = await supabase
          .from('settings')
          .select('commission')
          .eq('id', 'global')
          .single();
          
        if (settings && typeof settings.commission === 'number') {
          commissionRate = settings.commission / 100;
        }
      } catch (e) {
        console.error('Error fetching settings for commission:', e);
      }

      const netPayout = amount * (1 - commissionRate);

      const { error: updateWError } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'approved', 
          net_payout: netPayout,
          "processedAt": new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (updateWError) throw updateWError;

      const { data: userRecord } = await supabase
        .from('users')
        .select('balance')
        .eq('id', uid)
        .single();

      const currentBalance = userRecord?.balance || 0;
      if (currentBalance < amount) throw new Error('Insufficient balance');
      
      const { error: updateUError } = await supabase
        .from('users')
        .update({ balance: currentBalance - amount })
        .eq('id', uid);

      if (updateUError) throw updateUError;

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
      const { data: adminData } = await supabase
        .from('users')
        .select('*')
        .eq('id', adminUid)
        .single();

      if (!adminData || !isAdmin(adminData)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { data: wData } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (!wData) throw new Error('Withdrawal not found');
      if (wData.status !== 'pending') throw new Error('Already processed');

      const { error } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'rejected', 
          reason: reason || 'No reason provided',
          processedAt: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (error) throw error;

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
      // First, verify the user actually exists in our public.users table
      const { data: userExists, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', uid)
        .single();

      if (checkError || !userExists) {
        throw new Error(`User profile not found. Please complete your profile setup first.`);
      }

      const { error } = await supabase
        .from('vip_requests')
        .insert({
          uid,
          userName: userName || 'Unknown User',
          transactionId: transactionId,
          status: 'pending'
          // We removed explicit timestamp to avoid PGRST204 cache errors; 
          // Database will handle this via its DEFAULT NOW()
        });
      
      if (error) {
        console.error('DATABASE INSERT FAILED:', error);
        throw new Error(`Database Error: ${error.message} (Code: ${error.code})`);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        code: error.code || 'N/A',
        details: error.details || 'None',
        hint: error.hint || 'No hint provided',
        stack: error.stack
      };
      console.error('VIP Request Error Details:', errorDetails);
      res.status(500).json({ 
        error: error.message || 'Failed to submit VIP request',
        details: errorDetails
      });
    }
  });

  // API: Admin Repair Referral Income
  app.post('/api/admin/referral/sync', async (req, res) => {
    const { adminUid } = req.body;
    const REWARDS = [30, 20, 15, 10, 5, 2];

    try {
      const { data: adminData } = await supabase.from('users').select('*').eq('id', adminUid).single();
      if (!adminData || !isAdmin(adminData)) return res.status(403).json({ error: 'Unauthorized' });

      console.log('Starting global referral income sync...');
      
      // 1. Fetch all approved VIP requests to re-trace them
      const { data: vipRequests, error: vError } = await supabase
        .from('vip_requests')
        .select('*')
        .eq('status', 'approved');

      if (vError) throw vError;

      let totalAdujsted = 0;

      for (const request of vipRequests) {
        const uid = request.uid;
        const { data: userData } = await supabase.from('users').select('*').eq('id', uid).single();
        if (!userData) continue;

        let currentReferrerCode = userData["referredBy"];
        let vipLevelFound = 0;
        let depthCounter = 0;
        const MAX_SEARCH_DEPTH = 30;

        while (currentReferrerCode && vipLevelFound < REWARDS.length && depthCounter < MAX_SEARCH_DEPTH) {
          depthCounter++;
          const { data: referrerData } = await supabase.from('users').select('*').eq('referralCode', currentReferrerCode).single();
          if (!referrerData) break;

          const isVipValue = getProp(referrerData, 'isVip');
          const isVip = isVipValue === true || isVipValue === 'true' || isVipValue === 1;

          if (isVip) {
            const rewardAmount = REWARDS[vipLevelFound];
            
            // Check if this reward was already logged
            const { data: existingEarning } = await supabase
              .from('referral_earnings')
              .select('id')
              .eq('uid', referrerData.id)
              .eq('from_uid', uid)
              .eq('level', vipLevelFound + 1)
              .single();

            if (!existingEarning) {
              // Grant reward
              console.log(`Auditor: Rewarding missing VIP Level ${vipLevelFound + 1} to user ${referrerData.id} for VIP purchase of ${uid}`);
              
              const currentBalance = Number(getProp(referrerData, 'balance')) || 0;
              const currentTotalEarnings = Number(getProp(referrerData, 'totalReferralEarnings')) || 0;

              const updatePayload: any = {
                balance: currentBalance + rewardAmount
              };
              const refKeys = Object.keys(referrerData);
              if (refKeys.includes('totalReferralEarnings')) updatePayload['totalReferralEarnings'] = currentTotalEarnings + rewardAmount;
              else if (refKeys.includes('total_referral_earnings')) updatePayload['total_referral_earnings'] = currentTotalEarnings + rewardAmount;
              
              await supabase.from('users').update(updatePayload).eq('id', referrerData.id);
              
              await supabase.from('referral_earnings').insert({
                uid: referrerData.id,
                from_uid: uid,
                level: vipLevelFound + 1,
                amount: rewardAmount,
                timestamp: new Date().toISOString()
              });
              
              totalAdujsted++;
            }
            vipLevelFound++;
          }
          currentReferrerCode = getProp(referrerData, 'referredBy');
        }
      }

      res.json({ success: true, message: `Sync complete. ${totalAdujsted} reward records created or adjusted.` });
    } catch (error: any) {
      console.error('Referral Sync error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Get Referrer name by code (safe public lookup)
  app.get('/api/referrer/:code', async (req, res) => {
    const { code } = req.params;
    if (!code) return res.status(400).json({ error: 'Code required' });

    try {
      const { data, error } = await supabase
        .from('users')
        .select('name')
        .eq('referralCode', code.toUpperCase())
        .maybeSingle();
      
      if (error || !data) {
        return res.status(404).json({ error: 'Referrer not found' });
      }
      
      res.json({ name: data.name });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Promote user to admin (Secure bootstrap)
  app.post('/api/admin/promote', async (req, res) => {
    const { uid, adminUid } = req.body;
    if (!uid) return res.status(400).json({ error: 'UID required' });
    
    try {
      // 1. If adminUid is provided, verify they are an admin
      if (adminUid) {
        const { data: adminData } = await supabase.from('users').select('*').eq('id', adminUid).single();
        if (!adminData || !isAdmin(adminData)) {
          return res.status(403).json({ error: 'Only administrators can promote others' });
        }
      } else {
        // 2. If NO adminUid, ONLY allow self-promotion if the UID is the hardcoded Super Admin
        const superAdminId = 'ashishnehra450@gmail.com'.toLowerCase();
        
        // We fetch the user to check their email/id
        const { data: targetUser } = await supabase.from('users').select('*').eq('id', uid).single();
        const targetEmail = getProp(targetUser, 'email');
        const targetId = getProp(targetUser, 'id');

        const isSuper = (targetEmail && targetEmail.toLowerCase() === superAdminId) || 
                        (targetId && targetId.toString().toLowerCase() === superAdminId);

        if (!isSuper) {
          return res.status(403).json({ error: 'Unauthorized promotion attempt' });
        }
      }

      const { error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', uid);
        
      if (error) throw error;
      res.json({ success: true, message: 'User promoted to admin' });
    } catch (error: any) {
      console.error('Promotion error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Admin Approve VIP Membership
  app.post('/api/admin/vip/approve', async (req, res) => {
    const { requestId, adminUid } = req.body;
    if (!requestId || !adminUid) return res.status(400).json({ error: 'Request ID and Admin UID required' });

    const REWARDS = [30, 20, 15, 10, 5, 2]; // Levels 1 to 6
    const REWARD_DESC = ['Tier-1 Direct', 'Tier-2 Indirect', 'Tier-3 Network', 'Tier-4 Expansion', 'Tier-5 Deep Node', 'Tier-6 Terminal'];

    try {
      let adminQuery = supabase.from('users').select('*');
      
      // Check if adminUid is a UUID to avoid casting errors in PostgREST
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adminUid);
      
      if (isUUID) {
        adminQuery = adminQuery.eq('id', adminUid);
      } else {
        // If not UUID, assume it's a phone identifier
        adminQuery = adminQuery.eq('phone', adminUid);
      }

      const { data: adminData, error: adminFetchError } = await adminQuery.single();

      if (adminFetchError || !adminData) {
        console.error('Admin fetch failed or not found:', { adminUid, adminFetchError });
        return res.status(403).json({ 
          error: 'Unauthorized: Admin record not found',
          details: adminFetchError 
        });
      }

      if (!isAdmin(adminData)) {
        console.error('User is not an admin:', adminData);
        return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });
      }

      const { data: rData, error: rFetchError } = await supabase
        .from('vip_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (rFetchError || !rData) {
        console.error('Request not found:', { requestId, rFetchError });
        throw new Error('Request not found');
      }
      if (rData.status !== 'pending') throw new Error('Already processed');

      const uid = rData.uid;
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();

      if (!userData) throw new Error('User not found');
      console.log('User found:', userData.id, 'Columns:', Object.keys(userData));
      
      const updatePayload: any = {};
      const userKeys = Object.keys(userData);
      
      if (userKeys.includes('isVip')) updatePayload['isVip'] = true;
      else if (userKeys.includes('is_vip')) updatePayload['is_vip'] = true;
      else if (userKeys.includes('isvip')) updatePayload['isvip'] = true;
      
      if (userKeys.includes('vipPurchasedAt')) updatePayload['vipPurchasedAt'] = new Date().toISOString();
      else if (userKeys.includes('vip_purchased_at')) updatePayload['vip_purchased_at'] = new Date().toISOString();
      else if (userKeys.includes('vippurchasedat')) updatePayload['vippurchasedat'] = new Date().toISOString();

      console.log('Attempting to update user status with dynamic payload:', JSON.stringify(updatePayload));
      
      const { error: userUpdateError } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', uid);

      if (userUpdateError) {
        console.error('Error updating user status. Payload:', JSON.stringify(updatePayload));
        console.error('Supabase Error Details:', JSON.stringify(userUpdateError, null, 2));
        throw new Error(`User update failed: ${userUpdateError.message} (${userUpdateError.code})`);
      }

      console.log('Updating VIP request status...');
      const { data: rCheckData } = await supabase.from('vip_requests').select('*').limit(1);
      const requestKeys = rCheckData && rCheckData.length > 0 ? Object.keys(rCheckData[0]) : [];
      
      const requestUpdatePayload: any = { status: 'approved' };
      if (requestKeys.includes('processedAt')) requestUpdatePayload['processedAt'] = new Date().toISOString();
      else if (requestKeys.includes('processed_at')) requestUpdatePayload['processed_at'] = new Date().toISOString();
      else if (requestKeys.includes('processedat')) requestUpdatePayload['processedat'] = new Date().toISOString();

      const { error: requestUpdateError } = await supabase
        .from('vip_requests')
        .update(requestUpdatePayload)
        .eq('id', requestId);

      if (requestUpdateError) {
        console.error('Error updating vip_requests status:', {
          message: requestUpdateError.message,
          code: requestUpdateError.code,
          details: requestUpdateError.details,
          hint: requestUpdateError.hint
        });
        throw requestUpdateError;
      }

      let currentReferrerCode = userData["referredBy"];
      let vipLevelFound = 0;
      let depthCounter = 0;
      const MAX_SEARCH_DEPTH = 30; // Search up to 30 levels to find 6 VIPs

      console.log('Processing referral rewards. Initial referrer code:', currentReferrerCode);
      
      while (currentReferrerCode && vipLevelFound < REWARDS.length && depthCounter < MAX_SEARCH_DEPTH) {
        depthCounter++;
        try {
          console.log(`Checking depth ${depthCounter}, fetching referrer for code: ${currentReferrerCode}...`);
          const { data: referrerData, error: fetchRefError } = await supabase
            .from('users')
            .select('*')
            .eq('referralCode', currentReferrerCode)
            .single();

          if (fetchRefError || !referrerData) {
            console.warn(`Referrer not found at depth ${depthCounter} for code ${currentReferrerCode}`);
            break;
          }

          const isVipValue = getProp(referrerData, 'isVip');
          const isVip = isVipValue === true || isVipValue === 'true' || isVipValue === 1;

          if (isVip) {
            const rewardAmount = REWARDS[vipLevelFound];
            console.log(`VIP Level ${vipLevelFound + 1} found at depth ${depthCounter}. Rewarding user ${referrerData.id} with ${rewardAmount}`);
            
            const currentBalance = Number(getProp(referrerData, 'balance')) || 0;
            const currentTotalEarnings = Number(getProp(referrerData, 'totalReferralEarnings')) || 0;
            const newBalance = currentBalance + rewardAmount;
            const newTotalEarnings = currentTotalEarnings + rewardAmount;

            const updatePayload: any = {};
            const refKeys = Object.keys(referrerData);
            if (refKeys.includes('balance')) updatePayload['balance'] = newBalance;
            
            if (refKeys.includes('totalReferralEarnings')) updatePayload['totalReferralEarnings'] = newTotalEarnings;
            else if (refKeys.includes('total_referral_earnings')) updatePayload['total_referral_earnings'] = newTotalEarnings;
            else if (refKeys.includes('totalreferralearnings')) updatePayload['totalreferralearnings'] = newTotalEarnings;

            const { error: refBalanceError } = await supabase
              .from('users')
              .update(updatePayload)
              .eq('id', referrerData["id"]);
            
            if (refBalanceError) {
              console.error(`Error updating balance for referrer ${referrerData.id}:`, refBalanceError);
            }
            
            const { error: earningInsertError } = await supabase
              .from('referral_earnings')
              .insert({
                uid: referrerData["id"],
                from_uid: uid,
                level: vipLevelFound + 1, // Store the VIP level being paid
                amount: rewardAmount,
                timestamp: new Date().toISOString()
              });

            if (earningInsertError) {
              console.error(`Error inserting referral earning for referrer ${referrerData.id}:`, earningInsertError);
            }

            vipLevelFound++;
          } else {
            console.log(`User ${referrerData.id} at depth ${depthCounter} is not a VIP. Skipping...`);
          }

          currentReferrerCode = getProp(referrerData, 'referredBy');
        } catch (e: any) {
          console.error(`Unexpected error in reward loop at depth ${depthCounter}:`, e.message);
          break;
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('VIP Approval error:', error.message, error.stack);
      res.status(500).json({ 
        error: error.message || 'Internal server error during VIP approval',
        details: error.details || error.toString()
      });
    }
  });

  // API: Admin Upload QR Code
  app.post('/api/admin/upload-qr', async (req, res) => {
    const { adminUid, base64Data, fileName, contentType } = req.body;
    if (!adminUid || !base64Data) return res.status(400).json({ error: 'Missing data' });

    try {
      console.log('QR Upload Init: adminUid=', adminUid);
      const { data: adminData, error: adminFetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', adminUid)
        .single();

      if (adminFetchError) {
        console.error('Admin Fetch Error for QR:', JSON.stringify(adminFetchError, null, 2));
      }

      if (!adminData || !isAdmin(adminData)) {
        console.warn('Unauthorized QR upload attempt by:', adminUid);
        return res.status(403).json({ error: 'Unauthorized: Admin record not found or not an admin' });
      }

      console.log('Admin verified for QR upload:', adminData.email || adminData.id);

      // Ensure bucket exists
      try {
        await supabase.storage.createBucket('settings', { public: true });
      } catch (e) {}

      const base64Content = base64Data.split(';base64,').pop();
      const buffer = Buffer.from(base64Content, 'base64');
      const filePath = `admin/payment_qr_${Date.now()}`;

      console.log(`QR Upload: Processing ${buffer.length} bytes`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('settings')
        .upload(filePath, buffer, {
          contentType: contentType || 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('QR Storage Error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('settings')
        .getPublicUrl(filePath);
      
      // Merge with existing settings
      const { data: existing, error: fetchError } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
      
      if (fetchError) {
        console.warn('Settings fetch warning (non-fatal):', JSON.stringify(fetchError, null, 2));
      }

      const updateData: any = { id: 'global' };
      let qrKey = 'qrUrl';
      let apkKey = 'apkUrl';

      if (existing) {
        const keys = Object.keys(existing);
        const foundQr = keys.find(k => k.toLowerCase() === 'qrurl');
        if (foundQr) qrKey = foundQr;
        
        const foundApk = keys.find(k => k.toLowerCase() === 'apkurl');
        if (foundApk) apkKey = foundApk;

        // Populate other fields
        keys.forEach(k => {
          if (k.toLowerCase() !== 'qrurl' && k.toLowerCase() !== 'apkurl' && k !== 'id') {
            updateData[k] = existing[k];
          }
        });
        // Preserve other URL
        if (foundApk) updateData[foundApk] = existing[foundApk];
      }

      // Set newest QR URL
      updateData[qrKey] = publicUrl;

      const { error: upsertError } = await supabase
        .from('settings')
        .upsert(updateData);

      if (upsertError) {
        console.error('QR Settings Upsert Error:', JSON.stringify(upsertError, null, 2));
        throw upsertError;
      }

      console.log('QR Upload successful:', publicUrl);
      res.json({ success: true, url: publicUrl });
    } catch (error: any) {
      console.error('QR Upload error:', JSON.stringify(error, null, 2) || error);
      res.status(500).json({ error: error.message, details: error });
    }
  });

  // API: Admin Upload APK
  app.post('/api/admin/upload-apk', async (req, res) => {
    const { adminUid, base64Data, fileName } = req.body;
    if (!adminUid || !base64Data) return res.status(400).json({ error: 'Missing data' });

    try {
      console.log('APK Upload Init: adminUid=', adminUid);
      const { data: adminData, error: adminFetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', adminUid)
        .single();

      if (adminFetchError) {
        console.error('Admin Fetch Error for APK:', JSON.stringify(adminFetchError, null, 2));
      }

      if (!adminData || !isAdmin(adminData)) {
        console.warn('Unauthorized APK upload attempt by:', adminUid);
        return res.status(403).json({ error: 'Unauthorized: Admin record not found or not an admin' });
      }

      console.log('Admin verified for APK upload:', adminData.email || adminData.id);

      // Ensure bucket exists
      try {
        await supabase.storage.createBucket('settings', { public: true });
      } catch (e) {}

      const base64Content = base64Data.split(';base64,').pop();
      const buffer = Buffer.from(base64Content, 'base64');
      const filePath = `admin/app_release_${Date.now()}.apk`;

      console.log(`APK Upload: Processing ${buffer.length} bytes, Name: ${fileName}`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('settings')
        .upload(filePath, buffer, {
          contentType: 'application/vnd.android.package-archive',
          upsert: true
        });

      if (uploadError) {
        console.error('APK Storage Error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('settings')
        .getPublicUrl(filePath);
      
      // Merge with existing settings
      const { data: existing, error: fetchError } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();

      if (fetchError) {
        console.warn('Settings fetch warning (non-fatal):', JSON.stringify(fetchError, null, 2));
      }

      const updateData: any = { id: 'global' };
      let apkKey = 'apkUrl';
      let qrKey = 'qrUrl';

      if (existing) {
        const keys = Object.keys(existing);
        const foundApk = keys.find(k => k.toLowerCase() === 'apkurl');
        if (foundApk) apkKey = foundApk;

        const foundQr = keys.find(k => k.toLowerCase() === 'qrurl');
        if (foundQr) qrKey = foundQr;

        // Populate other fields
        keys.forEach(k => {
          if (k.toLowerCase() !== 'apkurl' && k.toLowerCase() !== 'qrurl' && k !== 'id') {
            updateData[k] = existing[k];
          }
        });
        // Preserve other URL
        if (foundQr) updateData[foundQr] = existing[foundQr];
      }

      // Set newest APK URL
      updateData[apkKey] = publicUrl;

      const { error: upsertError } = await supabase
        .from('settings')
        .upsert(updateData);

      if (upsertError) {
        console.error('APK Settings Upsert Error:', JSON.stringify(upsertError, null, 2));
        throw upsertError;
      }

      console.log('APK Upload successful:', publicUrl);
      res.json({ success: true, url: publicUrl });
    } catch (error: any) {
      console.error('APK Upload error:', JSON.stringify(error, null, 2) || error);
      res.status(500).json({ error: error.message, details: error });
    }
  });

  // API: Admin Update Settings
  app.post('/api/admin/update-settings', async (req, res) => {
    const { adminUid, settings } = req.body;
    if (!adminUid || !settings) return res.status(400).json({ error: 'Missing data' });

    try {
      const { data: adminData } = await supabase
        .from('users')
        .select('*')
        .eq('id', adminUid)
        .single();

      if (!adminData || !isAdmin(adminData)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Fetch existing settings to detect column casing
      const { data: existing, error: fetchError } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
      
      if (fetchError) {
        console.warn('Settings fetch warning (non-fatal):', JSON.stringify(fetchError, null, 2));
      }

      const updateData: any = { id: 'global' };
      
      // If we have existing data, try to match casing for the incoming settings keys
      if (existing) {
        const existingKeys = Object.keys(existing);
        
        Object.keys(settings).forEach(incomingKey => {
          const foundKey = existingKeys.find(ek => ek.toLowerCase() === incomingKey.toLowerCase());
          if (foundKey) {
            updateData[foundKey] = settings[incomingKey];
          } else {
            // Default to what the frontend sent if not found
            updateData[incomingKey] = settings[incomingKey];
          }
        });
      } else {
        // No existing record, just use what's provided
        Object.assign(updateData, settings);
      }

      const { error } = await supabase
        .from('settings')
        .upsert(updateData);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Settings Update error:', error);
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
