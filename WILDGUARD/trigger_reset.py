import requests

# Manually trigger a detection alert by calling the reset endpoint
# This will emit a reset_signal which should be received by the frontend

try:
    response = requests.post('http://localhost:5000/reset')
    print(f"Reset endpoint response: {response.status_code}")
    print(f"Response body: {response.text}")
except Exception as e:
    print(f"Error calling reset endpoint: {e}")