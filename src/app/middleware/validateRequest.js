const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
                cookies: req.cookies,
            });
            
            req.body = parsed.body;
            req.query = parsed.query;
            req.params = parsed.params;
            req.cookies = parsed.cookies;
            
            next();
        } catch (error) {
            next(error);
        }
    };
};

export default validateRequest;
