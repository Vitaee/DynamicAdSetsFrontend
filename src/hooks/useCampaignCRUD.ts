import { useCampaignsStore } from '../stores/campaigns';

/**
 * Comprehensive CRUD operations hook for campaigns
 * Following DRY principles for reusable campaign management
 */
export function useCampaignCRUD() {
  const {
    createCampaign,
    updateCampaignStatus,
    deleteCampaign,
    updateCampaignInStore,
    removeCampaignFromStore,
    addCampaignToStore,
    getCampaignById,
    getActionState,
    
    // Also include ad set operations for complete CRUD
    createAdSet,
    updateAdSetStatus,
    deleteAdSet,
    loadAdSets,
    getAdSetsByCampaignFromStore,
    updateAdSetInStore,
    removeAdSetFromStore
  } = useCampaignsStore();

  // Campaign operations with consistent error handling
  const campaignOperations = {
    create: async (data: Parameters<typeof createCampaign>[0]) => {
      try {
        await createCampaign(data);
        return { success: true };
      } catch (error) {
        console.error('Campaign creation failed:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to create campaign' 
        };
      }
    },

    updateStatus: async (campaignId: string, action: 'pause' | 'resume') => {
      try {
        await updateCampaignStatus(campaignId, action);
        return { success: true };
      } catch (error) {
        console.error('Campaign status update failed:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to update campaign status' 
        };
      }
    },

    delete: async (campaignId: string) => {
      try {
        await deleteCampaign(campaignId);
        return { success: true };
      } catch (error) {
        console.error('Campaign deletion failed:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to delete campaign' 
        };
      }
    }
  };

  // Ad Set operations with consistent error handling
  const adSetOperations = {
    create: async (campaignId: string, data: Parameters<typeof createAdSet>[1]) => {
      try {
        await createAdSet(campaignId, data);
        return { success: true };
      } catch (error) {
        console.error('Ad set creation failed:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to create ad set' 
        };
      }
    },

    updateStatus: async (adSetId: string, action: 'pause' | 'resume') => {
      try {
        await updateAdSetStatus(adSetId, action);
        return { success: true };
      } catch (error) {
        console.error('Ad set status update failed:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to update ad set status' 
        };
      }
    },

    delete: async (adSetId: string) => {
      try {
        await deleteAdSet(adSetId);
        return { success: true };
      } catch (error) {
        console.error('Ad set deletion failed:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to delete ad set' 
        };
      }
    },

    load: async (campaignId: string) => {
      try {
        const adSets = await loadAdSets(campaignId);
        return { success: true, data: adSets };
      } catch (error) {
        console.error('Ad sets loading failed:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to load ad sets' 
        };
      }
    }
  };

  return {
    // Campaign CRUD operations
    campaigns: campaignOperations,
    
    // Ad Set CRUD operations
    adSets: adSetOperations,
    
    // Direct store access for advanced use cases
    store: {
      getCampaignById,
      getAdSetsByCampaignFromStore,
      updateCampaignInStore,
      updateAdSetInStore,
      removeCampaignFromStore,
      removeAdSetFromStore,
      addCampaignToStore,
      getActionState
    }
  };
}

/**
 * Simplified hook for common campaign operations
 * For components that only need basic CRUD without advanced features
 */
export function useSimpleCampaignCRUD() {
  const { campaigns, adSets } = useCampaignCRUD();
  
  return {
    createCampaign: campaigns.create,
    updateCampaignStatus: campaigns.updateStatus,
    deleteCampaign: campaigns.delete,
    
    createAdSet: adSets.create,
    updateAdSetStatus: adSets.updateStatus,
    deleteAdSet: adSets.delete,
    loadAdSets: adSets.load
  };
}
