# Workers AI example using Mistral 7B and BGE (base 756)

Cloudflare Workers AI allows you to run LLMs on the Cloudflare network on serverless GPUs. This can significantly reduce the cost associated with your AI app if you are not constantly soliciting the LLM. 

## Pre-requisits
- Cloudflare account
- Prepared Postgres database with embeddings. See (Ask-Neon)[https://github.com/neondatabase/ask-neon] project if ou do not have one.

To get started, you need a Cloudflare account and install Wrangler.
```
npm install wrangler --save-dev
```

Login to your account
```
wrangler login
```

Once done, create a Workers project:
```
npm create cloudflare@latest
```

Install the Workers AI client library:
```
npm install --save-dev @cloudflare/ai
```

Locate the `wrangler.toml` file and append the following to bind Workers AI to your Worker:

```toml
[ai]
binding = "AI" # i.e. available in your Worker on env.AI
```

Add DATABASE url to your environement variables:

```
wrangler secret put DATABASE_URL
```

Run the app:
```
wrangler dev --remote
```

