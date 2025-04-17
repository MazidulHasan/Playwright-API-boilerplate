exports.createUser = (req, res) => {
    const userData = req.body;
    // In a real app, you'd save this to a database.
    console.log('Received user data:', userData);
    
    res.status(201).json({
        message: 'User registered successfully!',
        user: userData
    });
};
