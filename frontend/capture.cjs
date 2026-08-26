const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1440, height: 900 } });
  const page = await browser.newPage();
  
  const WS_ID = "6a8ed33b48e956e93229dec0";
  const PROJ1_ID = "6a8ed37c48e956e93229dec2"; // Platform Redesign
  const PROJ2_ID = "6a8ed3c148e956e93229dec4"; // Product Launch
  
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.mouse.move(0, 0);
    await page.screenshot({ path: 'C:/Projects/cobly/images/01-login.png' });
    console.log('Took 01-login.png');

    console.log('Logging in...');
    await page.type('input[type="email"]', 'cobly.demo@example.com');
    await page.type('input[type="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await wait(1500); 
    await page.screenshot({ path: 'C:/Projects/cobly/images/02-dashboard.png' });
    console.log('Took 02-dashboard.png');

    console.log('Navigating to workspace...');
    await page.goto(`http://localhost:5173/dashboard/workspaces/${WS_ID}`, { waitUntil: 'networkidle0' });
    await wait(1500);
    await page.screenshot({ path: 'C:/Projects/cobly/images/03-workspace.png' });
    console.log('Took 03-workspace.png');

    console.log('Navigating to kanban...');
    await page.goto(`http://localhost:5173/dashboard/workspaces/${WS_ID}/projects/${PROJ1_ID}`, { waitUntil: 'networkidle0' });
    await wait(2000);
    await page.screenshot({ path: 'C:/Projects/cobly/images/04-kanban.png' });
    console.log('Took 04-kanban.png');

    console.log('Navigating to collaboration (discussions)...');
    await page.goto(`http://localhost:5173/dashboard/workspaces/${WS_ID}/projects/${PROJ2_ID}`, { waitUntil: 'networkidle0' });
    await wait(1000);
    const tabs = await page.$$('button[role="tab"]');
    for (let tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text.includes('Discussions')) {
        await tab.click();
        break;
      }
    }
    await wait(1500);
    await page.screenshot({ path: 'C:/Projects/cobly/images/05-collaboration.png' });
    console.log('Took 05-collaboration.png');

    console.log('Navigating to activity...');
    await page.goto(`http://localhost:5173/dashboard/workspaces/${WS_ID}/activity`, { waitUntil: 'networkidle0' });
    await wait(1500);
    await page.screenshot({ path: 'C:/Projects/cobly/images/06-activity.png' });
    console.log('Took 06-activity.png');

  } catch (err) {
    console.error("Error during screenshots:", err);
  } finally {
    await browser.close();
  }
})();
