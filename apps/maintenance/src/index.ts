import { serve } from "bun";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Under Maintenance</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #000;
            color: #fff;
            text-align: center;
        }
        .container {
            padding: 40px;
            background: rgba(10, 10, 10, 0.8);
            border: 1px solid #333;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 255, 255, 0.1);
            max-width: 600px;
            width: 90%;
        }
        .logo {
            margin-bottom: 20px;
            width: 80px;
            height: 80px;
        }
        h1 {
            color: #0ff;
            margin-top: 0;
            font-weight: 600;
            letter-spacing: 1px;
        }
        p {
            font-size: 1.1rem;
            color: #aaa;
            margin-bottom: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <svg class="logo" viewBox="0 0 1157.71 966.64203" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(-829.58511,-273.01791)">
                <path fill="none" stroke="#0ff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" d="m 1859.7858,323.35452 -282.1415,282.00697 -175.9315,2.67881 204.5744,242.45844 c 44.135,46.3893 18.0609,211.39816 -113.6524,214.04536 l -282.2368,3.7884" />
                <path fill="none" stroke="#0ff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" d="m 1715.7795,558.53243 144.2873,170.66228 126.9424,1.45142" />
                <path fill="none" stroke="#0ff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" d="m 829.7622,700.50949 124.20614,-0.8798 174.48146,237.95472" />
                <path fill="none" stroke="#0ff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" d="M 1639.4333,440.66467 H 1351.461 c -107.236,1.07969 -166.0236,151.18959 -119.2072,210.28679 l 206.2686,253.14779 -170.1046,-1.33941 -283.95417,285.29356 526.38667,-1.3394 c 139.1891,1.5285 218.2508,-160.6874 224.5222,-251.24785 6.0346,-87.14263 -38.9838,-166.16717 -129.4244,-271.12063" />
                <path fill="none" stroke="#0ff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" d="m 1233.5932,837.98085 c -144.9648,-136.40377 -155.7597,-276.3282 -82.5454,-393.17604 31.5354,-50.32946 75.4281,-117.57807 201.7526,-120.66849 h 506.2955" />
                <ellipse fill="none" stroke="#0ff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" cx="1855.4126" cy="324.80603" rx="27.122978" ry="26.788126" />
                <ellipse fill="none" stroke="#0ff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" cx="1405.5012" cy="608.04028" rx="29.360201" ry="26.518892" />
                <ellipse fill="none" stroke="#0ff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" cx="1435.335" cy="900.22168" rx="27.465996" ry="26.04534" />
                <ellipse fill="none" stroke="#0ff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" cx="984.98743" cy="1185.7733" rx="28.413097" ry="28.88665" />
            </g>
        </svg>
        <h1>System Update in Progress</h1>
        <p>Syncoboard is currently undergoing scheduled maintenance. We'll be back online shortly.</p>
    </div>
</body>
</html>`;

serve({
  port: PORT,
  fetch() {
    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
});

console.log(`Maintenance app listening on port ${PORT}`);
