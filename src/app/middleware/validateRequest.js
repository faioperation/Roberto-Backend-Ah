const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
                cookies: req.cookies,
            });
            
            if (parsed.body !== undefined) req.body = parsed.body;
            if (parsed.query !== undefined) req.query = parsed.query;
            if (parsed.params !== undefined) req.params = parsed.params;
            if (parsed.cookies !== undefined) req.cookies = parsed.cookies;
            
            next();
        } catch (error) {
            next(error);
        }
    };
};

export default validateRequest;
