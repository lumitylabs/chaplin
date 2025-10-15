// server/src/utils/withCors.js

const allowedOrigins = [
    'http://localhost:5173',
    // Adicione a URL de produção do seu frontend aqui quando for fazer o deploy
    // 'https://sua-plataforma.com' 
];

export const withCors = (handler) => {
  return async (req, res, context) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Se for uma requisição preflight (OPTIONS), responda imediatamente com 204 e encerre.
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    // Se não for preflight, continue para o próximo handler (que será o withAuth).
    return handler(req, res, context);
  };
};