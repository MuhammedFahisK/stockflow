import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Log an activity to firestore.  
 *
 * @param {Object} params
 * @param {string} params.userId - UID or identifier of the user performing the action
 * @param {string} params.company - Company name/context (optional)
 * @param {string} params.action - Short description of the action performed
 * @param {string} params.details - Optional additional details
 */
export const logActivity = async ({ userId, company, action, details }) => {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      company: company || null,
      action,
      details: details || '',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to log activity', err);
  }
};
