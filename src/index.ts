import { Ai } from '@cloudflare/ai'
import { Client } from '@neondatabase/serverless'; // Import a PostgreSQL client library

export interface Env {
  AI: any;
  DATABASE_URL: string;
}

export default {
	async fetch(request: Request, env: Env) {

		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
			"Access-Control-Max-Age": "86400",
		  };

		const ai = new Ai(env.AI);
		
		// Get user query	
		const url = new URL(request.url);
		const query = url.searchParams.get('query');

		// Generate query embedding
		const { data } = await ai.run('@cf/baai/bge-base-en-v1.5', { text: query || "" });
		const q_embeddings = data[0];
		const q_embeddings_str = q_embeddings.toString().replace(/\.\.\./g, '');
		
		// Performm similarity search with pgvector and return top 3 results
		const client = new Client(env.DATABASE_URL);
		await client.connect();
		const sql_query = `SELECT id, content FROM documents ORDER BY bge_base_embedding <=> '[${q_embeddings_str}]' LIMIT 3`;
		const {rows} = await client.query(sql_query);
		const context = rows.reduce((acc, cur) => {
			return acc + cur.content;
			}, '\n');
		const ids = rows.map(row => row.id);
		await client.end();
		
		// Generate text with Mistral 7B instruct

		const response = await ai.run('@cf/mistral/mistral-7b-instruct-v0.1', {
				messages: [
					{ 
						role: 'system', 
						content: 
						`
							<s>[INST] You are a friendly assistant.
						Give a detailed answer to the below Question based on the Context and question provided by the user. 
						If the context do not contain the answer to the question, reply: I don't know. </s>[/INST]
						` 
						},
					{ 
						role: 'user', 
						content: 
						`
						Question: ${query}
					
						Context: ${context}
				
						Answer:
						`
					}
				],
				max_tokens: 1800,
				stream: false
			}
		);

		return new Response(JSON.stringify({
			model: 'mistral-7b-instruct-v0.1',
			response, 
			ids,
		}), { headers: { 
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		  }});
		},
};

