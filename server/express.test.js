const axios = require('axios');

test('should return a 200 status code', async () => {
  try {
    const response = await axios.get('http://localhost:8000');
    expect(response.status).toBe(200);
  } catch (error) {
    expect(error.response.status).toBe(200);
  }
});