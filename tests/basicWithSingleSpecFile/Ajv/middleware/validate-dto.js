function validateDto(ajvValidater) {
    return (req, res, next) => {
        const valid = ajvValidater(req.body);
        if (!valid) {
            return res.status(400).json({ errors: ajvValidater.errors });
        }
        next();
    }
}

module.exports = validateDto;