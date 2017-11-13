define((require) => {
    const axios = require('axios');

    return {
        getUserInfo: function () {
            return new Promise((res, rej) => {
                res({
                    name: 'Jone Polvora',
                    email: 'jpolvora@gmail.com'
                })
            });

        }
    }
});