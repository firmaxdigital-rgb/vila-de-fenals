const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  console.log('Navigating...');
  await page.goto('http://localhost:3000/viladefenals/acceso/f28487c5');
  await page.waitForSelector('button');
  
  // Start check-in process
  console.log('Clicking check-in...');
  const buttons = await page.('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Realizar Check-in')) {
      await btn.click();
      break;
    }
  }
  
  await page.waitForTimeout(2000);
  
  console.log('Taking first screenshot...');
  await page.screenshot({ path: 'C:/Users/elmig/.gemini/antigravity/brain/14ed6c8e-97d0-434f-bb7a-5d85417dfd9c/form_empty.png' });

  console.log('Typing bad issue date...');
  await page.type('input[name=\echa_expedicion\]', '2030-01-01');
  await page.type('input[name=\echa_nacimiento\]', '1985-05-10');
  
  // Submit to trigger validation errors
  console.log('Submitting...');
  const submitBtn = await page.button[type=\`submit\`];
  if(submitBtn) await submitBtn.click();
  
  await page.waitForTimeout(1000);
  
  console.log('Taking validation screenshot...');
  await page.screenshot({ path: 'C:/Users/elmig/.gemini/antigravity/brain/14ed6c8e-97d0-434f-bb7a-5d85417dfd9c/form_validation.png' });
  
  await browser.close();
  console.log('Done');
})();
