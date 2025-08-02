import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get item types
router.get('/item-types', authenticateToken, async (req, res) => {
  try {
    const { data: itemTypes, error } = await supabase
      .from('itemtype')
      .select('*')
      .order('id');

    if (error) {
      console.error('Item types fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch item types' });
    }

    res.json({ itemTypes });
  } catch (error) {
    console.error('Item types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get colors
router.get('/colors', authenticateToken, async (req, res) => {
  try {
    const { data: colors, error } = await supabase
      .from('colors')
      .select('*')
      .order('primary_color', { ascending: true })
      .order('color_name', { ascending: true });

    if (error) {
      console.error('Colors fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch colors' });
    }

    res.json({ colors });
  } catch (error) {
    console.error('Colors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all designs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: designs, error } = await supabase
      .from('designs')
      .select(`
        *,
        user_profiles!designs_created_by_fkey(name),
        itemtype(itemtype),
        colors!designs_color_id_fkey(color_name, primary_color)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Designs fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch designs' });
    }

    res.json({ designs });
  } catch (error) {
    console.error('Designs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new design
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { design_number, item_type_id, color_ids } = req.body;

    if (!design_number || !item_type_id || !color_ids || !Array.isArray(color_ids) || color_ids.length === 0) {
      return res.status(400).json({ error: 'Design number, item type, and at least one color are required' });
    }

    // Create multiple design entries, one for each color
    const designEntries = color_ids.map(color_id => ({
      design_number,
      item_type_id: parseInt(item_type_id),
      color_id: parseInt(color_id),
      created_by: req.user.id
    }));

    const { data: designs, error } = await supabase
      .from('designs')
      .insert(designEntries)
      .select(`
        *,
        user_profiles!designs_created_by_fkey(name),
        itemtype(itemtype),
        colors!designs_color_id_fkey(color_name, primary_color)
      `);

    if (error) {
      console.error('Design creation error:', error);
      return res.status(500).json({ error: 'Failed to create design' });
    }

    res.status(201).json({
      message: `Design created successfully with ${color_ids.length} color(s)`,
      designs
    });
  } catch (error) {
    console.error('Design creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update design
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { design_number, item_type_id, color_id } = req.body;

    if (!design_number || !item_type_id || !color_id) {
      return res.status(400).json({ error: 'Design number, item type, and color are required' });
    }

    const { data: design, error } = await supabase
      .from('designs')
      .update({
        design_number,
        item_type_id: parseInt(item_type_id),
        color_id: parseInt(color_id),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        user_profiles!designs_created_by_fkey(name),
        itemtype(itemtype),
        colors!designs_color_id_fkey(color_name, primary_color)
      `)
      .single();

    if (error) {
      console.error('Design update error:', error);
      return res.status(500).json({ error: 'Failed to update design' });
    }

    if (!design) {
      return res.status(404).json({ error: 'Design not found or you do not have permission to update it' });
    }

    res.json({
      message: 'Design updated successfully',
      design
    });
  } catch (error) {
    console.error('Design update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete design
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('designs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Design deletion error:', error);
      return res.status(500).json({ error: 'Failed to delete design' });
    }

    res.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Design deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;