import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all parties
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: parties, error } = await supabase
      .from('parties')
      .select(`
        *,
        user_profiles!parties_created_by_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Parties fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch parties' });
    }

    res.json({ parties });
  } catch (error) {
    console.error('Parties error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single party
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: party, error } = await supabase
      .from('parties')
      .select(`
        *,
        user_profiles!parties_created_by_fkey(name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Party fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch party' });
    }

    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    res.json({ party });
  } catch (error) {
    console.error('Party fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new party
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      address, 
      city, 
      state, 
      pincode, 
      phone_number,
      gst_number
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Party name is required' });
    }

    const { data: party, error } = await supabase
      .from('parties')
      .insert([
        {
          name,
          description: description || '',
          address: address || '',
          city: city || '',
          state: state || '',
          pincode: pincode || '',
          phone_number: phone_number || '',
          gst_number: gst_number || '',
          created_by: req.user.id
        }
      ])
      .select(`
        *,
        user_profiles!parties_created_by_fkey(name)
      `)
      .single();

    if (error) {
      console.error('Party creation error:', error);
      return res.status(500).json({ error: 'Failed to create party' });
    }

    res.status(201).json({
      message: 'Party created successfully',
      party
    });
  } catch (error) {
    console.error('Party creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update party
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      address, 
      city, 
      state, 
      pincode, 
      phone_number,
      gst_number
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Party name is required' });
    }

    const { data: party, error } = await supabase
      .from('parties')
      .update({
        name,
        description: description || '',
        address: address || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        phone_number: phone_number || '',
        gst_number: gst_number || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        user_profiles!parties_created_by_fkey(name)
      `)
      .single();

    if (error) {
      console.error('Party update error:', error);
      return res.status(500).json({ error: 'Failed to update party' });
    }

    if (!party) {
      return res.status(404).json({ error: 'Party not found or you do not have permission to update it' });
    }

    res.json({
      message: 'Party updated successfully',
      party
    });
  } catch (error) {
    console.error('Party update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete party
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('parties')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Party deletion error:', error);
      return res.status(500).json({ error: 'Failed to delete party' });
    }

    res.json({ message: 'Party deleted successfully' });
  } catch (error) {
    console.error('Party deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;