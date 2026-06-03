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
            background-color: #f5f5f5;
            color: #333;
            text-align: center;
        }
        .container {
            padding: 40px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 90%;
        }
        h1 {
            color: #2c3e50;
            margin-top: 0;
        }
        p {
            font-size: 1.2rem;
            color: #666;
            margin-bottom: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Under Maintenance</h1>
        <p>We'll be back shortly.</p>
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
