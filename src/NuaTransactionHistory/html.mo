import Time "mo:base/Time";
import Int "mo:base/Int";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Types "./types";

module {
  public type HttpResponse = Types.HttpResponse;
  
  // Fast-loading debug dashboard with lightweight tests
  public func generateDebugDashboard() : async HttpResponse {
    let currentTime = Int.toText(Time.now());
    let htmlHeader = generateHtmlHeader(currentTime);
    
    // Generate quick overview without heavy API calls
    let quickOverview = generateQuickOverview();
    
    // Add documentation section
    let documentationSection = generateDocumentationSection();
    
    let htmlFooter = generateHtmlFooter();
    
    let htmlContent = htmlHeader # quickOverview # documentationSection # htmlFooter;

    {
      status_code = 200;
      headers = [("Content-Type", "text/html")];
      body = Iter.toArray(Text.encodeUtf8(htmlContent).vals());
      upgrade = null;
    }
  };

  // Generate quick overview without heavy API calls
  private func generateQuickOverview() : Text {
    let baseUrl = "https://xv4td-yyaaa-aaaam-qdxlq-cai.raw.icp0.io";
    
    "<h2>Quick Endpoint Overview</h2>
    <div class='endpoint-list'>
      <h3>Available Endpoints (Click to Test)</h3>
      <div class='endpoint-grid'>
        <div class='endpoint-card'>
          <h4>Daily Data</h4>
          <a href='" # baseUrl # "/dapp-radar/aggregated-data/2024-08-01/daily?page=1' target='_blank' class='test-link'>
            GET /dapp-radar/aggregated-data/2024-08-01/daily?page=1
          </a>
          <p class='endpoint-desc'>Daily aggregated user activity and volume</p>
        </div>
        
        <div class='endpoint-card'>
          <h4>Hourly Data</h4>
          <a href='" # baseUrl # "/dapp-radar/aggregated-data/2024-08-01/hourly?page=1' target='_blank' class='test-link'>
            GET /dapp-radar/aggregated-data/2024-08-01/hourly?page=1
          </a>
          <p class='endpoint-desc'>Hourly aggregated user activity and volume</p>
        </div>
        
        <div class='endpoint-card'>
          <h4>Balance</h4>
          <a href='" # baseUrl # "/dapp-radar/aggregated-data/balance' target='_blank' class='test-link'>
            GET /dapp-radar/aggregated-data/balance
          </a>
          <p class='endpoint-desc'>Current token balance with USD equivalent</p>
        </div>
        
        <div class='endpoint-card'>
          <h4>Transaction Count</h4>
          <a href='" # baseUrl # "/dapp-radar/aggregated-data/transactions' target='_blank' class='test-link'>
            GET /dapp-radar/aggregated-data/transactions
          </a>
          <p class='endpoint-desc'>Total number of transactions</p>
        </div>
        
        <div class='endpoint-card'>
          <h4>Unique Active Wallets</h4>
          <a href='" # baseUrl # "/dapp-radar/aggregated-data/uaw' target='_blank' class='test-link'>
            GET /dapp-radar/aggregated-data/uaw
          </a>
          <p class='endpoint-desc'>Total registered users</p>
        </div>
        
        <div class='endpoint-card'>
          <h4>Cache Status</h4>
          <a href='" # baseUrl # "/debug/cache-status' target='_blank' class='test-link'>
            GET /debug/cache-status
          </a>
          <p class='endpoint-desc'>Cache status and statistics</p>
        </div>
      </div>
    </div>
    
    <div class='test-section'>
      <h3>Run Live Tests</h3>
      <button onclick='runAllTests()' class='test-button'>Run All Endpoint Tests</button>
      <div id='test-results' class='test-results'></div>
    </div>
    
    <script>
      async function runAllTests() {
        const button = document.querySelector('.test-button');
        const results = document.getElementById('test-results');
        
        button.disabled = true;
        button.textContent = 'Running Tests...';
        results.innerHTML = '<div class=\"loading\">Running endpoint tests...</div>';
        
        const endpoints = [
          '/dapp-radar/aggregated-data/2024-08-01/daily?page=1',
          '/dapp-radar/aggregated-data/2024-08-01/hourly?page=1',
          '/dapp-radar/aggregated-data/balance',
          '/dapp-radar/aggregated-data/transactions',
          '/dapp-radar/aggregated-data/uaw',
          '/debug/cache-status'
        ];
        
        const baseUrl = '" # baseUrl # "';
        let testResults = [];
        
        // Run tests in parallel for faster execution
        const testPromises = endpoints.map(async (endpoint) => {
          try {
            const startTime = Date.now();
            const response = await fetch(baseUrl + endpoint);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            const isOk = response.ok;
            const statusText = response.status + ' ' + response.statusText;
            
            return {
              endpoint,
              status: isOk ? 'ok' : 'error',
              statusText,
              responseTime: responseTime + 'ms',
              fullUrl: baseUrl + endpoint
            };
          } catch (error) {
            return {
              endpoint,
              status: 'error',
              statusText: 'Network Error: ' + error.message,
              responseTime: 'N/A',
              fullUrl: baseUrl + endpoint
            };
          }
        });
        
        try {
          testResults = await Promise.all(testPromises);
        } catch (error) {
          console.error('Test execution failed:', error);
        }
        
        // Display results
        let html = '<h4>Test Results:</h4>';
        testResults.forEach(result => {
          const statusClass = result.status === 'ok' ? 'status-ok' : 'status-error';
          const statusIcon = result.status === 'ok' ? 'PASS' : 'FAIL';
          
          html += `
            <div class='endpoint test-result ${statusClass}'>
              <div class='endpoint-title'>
                <span class='method'>GET</span>
                <a href='${result.fullUrl}' target='_blank'>${result.endpoint}</a>
                <span class='status-badge'>${statusIcon} ${result.statusText}</span>
                <span class='response-time'>${result.responseTime}</span>
              </div>
            </div>
          `;
        });
        
        results.innerHTML = html;
        button.disabled = false;
        button.textContent = 'Run All Endpoint Tests';
      }
    </script>"
  };

  // Generate documentation section
  private func generateDocumentationSection() : Text {
    "<h2>API Documentation</h2>
    <div class='endpoint'>
      <h3>Main Endpoints</h3>
      <div class='doc-section'>
        <h4>1. Daily Aggregated Data</h4>
        <code>GET /dapp-radar/aggregated-data/{date}/daily?page={page}</code>
        <p>Returns daily aggregated user activity and volume data for a specific date.</p>
        <ul>
          <li><strong>date:</strong> YYYY-MM-DD format (e.g., 2024-08-01)</li>
          <li><strong>page:</strong> Page number for pagination (default: 1)</li>
        </ul>
      </div>
      
      <div class='doc-section'>
        <h4>2. Hourly Aggregated Data</h4>
        <code>GET /dapp-radar/aggregated-data/{date}/hourly?page={page}</code>
        <p>Returns hourly aggregated user activity and volume data for a specific date.</p>
        <ul>
          <li><strong>date:</strong> YYYY-MM-DD format (e.g., 2024-08-01)</li>
          <li><strong>page:</strong> Page number for pagination (default: 1)</li>
        </ul>
      </div>
      
      <div class='doc-section'>
        <h4>3. Current Balance</h4>
        <code>GET /dapp-radar/aggregated-data/balance</code>
        <p>Returns current token balance with USD equivalent.</p>
      </div>
      
      <div class='doc-section'>
        <h4>4. Transaction Count</h4>
        <code>GET /dapp-radar/aggregated-data/transactions</code>
        <p>Returns total number of transactions in the ledger.</p>
      </div>
      
      <div class='doc-section'>
        <h4>5. Unique Active Wallets (UAW)</h4>
        <code>GET /dapp-radar/aggregated-data/uaw</code>
        <p>Returns total number of registered users on Nuance.</p>
      </div>
      
      <div class='doc-section'>
        <h4>6. Cache Status</h4>
        <code>GET /debug/cache-status</code>
        <p>Returns cache status and statistics.</p>
      </div>
    </div>";
  };

  // Generate HTML header with enhanced CSS styles
  private func generateHtmlHeader(currentTime: Text) : Text {
    "<!DOCTYPE html><html><head><title>NUA Transasction History</title><style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
      .container { max-width: 1400px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
      h1 { color: #333; text-align: center; margin-bottom: 10px; font-size: 2.5em; }
      h2 { color: #555; border-bottom: 3px solid #667eea; padding-bottom: 10px; margin-top: 40px; }
      h3 { color: #666; margin-top: 30px; }
      h4 { color: #777; margin-top: 20px; }
      .endpoint { margin: 15px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; transition: all 0.3s ease; }
      .endpoint:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
      .status-ok { background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-color: #28a745; }
      .status-error { background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%); border-color: #dc3545; }
      .endpoint-title { font-weight: bold; font-size: 16px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
      .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
      .status-badge.ok { background-color: #28a745; color: white; }
      .status-badge.error { background-color: #dc3545; color: white; }
      .url-info { margin: 10px 0; padding: 8px; background-color: #f1f3f4; border-radius: 4px; font-family: monospace; font-size: 12px; }
      .url-info a { color: #1a73e8; text-decoration: none; }
      .url-info a:hover { text-decoration: underline; }
      .response { background-color: #f8f9fa; padding: 15px; border-radius: 6px; font-family: 'Monaco', 'Menlo', monospace; font-size: 11px; overflow-x: auto; max-height: 300px; overflow-y: auto; border: 1px solid #e9ecef; }
      .timestamp { color: #666; font-size: 14px; text-align: center; margin-bottom: 30px; }
      .method { color: #1a73e8; font-weight: bold; background-color: #e8f0fe; padding: 4px 8px; border-radius: 4px; }
      .doc-section { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 6px; }
      .doc-section code { background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace; }
      .doc-section ul { margin: 10px 0; }
      .doc-section li { margin: 5px 0; }
      .endpoint-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
      .endpoint-card { background: white; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; transition: all 0.3s ease; }
      .endpoint-card:hover { border-color: #667eea; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1); }
      .endpoint-card h4 { margin: 0 0 10px 0; color: #667eea; }
      .test-link { display: block; background-color: #f8f9fa; padding: 8px 12px; border-radius: 4px; text-decoration: none; color: #495057; font-family: monospace; font-size: 12px; margin: 10px 0; }
      .test-link:hover { background-color: #e9ecef; text-decoration: none; }
      .endpoint-desc { margin: 10px 0 0 0; font-size: 14px; color: #6c757d; }
      .test-section { margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; }
      .test-button { background-color: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; transition: background-color 0.3s; }
      .test-button:hover { background-color: #5a6fd8; }
      .test-button:disabled { background-color: #6c757d; cursor: not-allowed; }
      .test-results { margin-top: 20px; }
      .loading { text-align: center; padding: 20px; font-style: italic; color: #6c757d; }
      .test-result { margin: 10px 0; padding: 15px; border-radius: 6px; }
      .response-time { margin-left: auto; font-size: 12px; color: #6c757d; }
    </style></head><body><div class='container'>
    <h1>NUA Transaction History</h1>
    <p class='timestamp'>Generated at: " # currentTime # "</p>";
  };

  // Generate HTML footer
  private func generateHtmlFooter() : Text {
    "</div></body></html>";
  };
}
