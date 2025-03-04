interface BandwidthTokenResponse {
    access_token: string;
    expiration: number;
  }
  
  export const fetchBandwidthToken = async (textGridAuthToken: string): Promise<string> => {
    try {
      const response = await fetch('https://cors-anywhere.herokuapp.com/https://api.textgrid.com/2010-04-01/ghl/getsdksid.json', {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'Authorization': `Bearer ${textGridAuthToken}`,
          'Connection': 'keep-alive',
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data: BandwidthTokenResponse = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Failed to fetch Bandwidth token:', error);
      throw error;
    }
  }