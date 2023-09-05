import jwt from 'jsonwebtoken';
import Configs from './configs';

class Auth {
    validate(req: any, res: any, next: any) {
        let token = req.headers['x-access-token']?.split(',')[0];

        if (token) {
            jwt.verify(token, Configs.secret, function (err: any, decoded: any) {
                if (err) {
                    return res.status(403).send({
                        success: false
                    });
                }
                next();
            });
        }
        else {
            return res.status(401).send({
                success: false
            });
        }
    }    
}

export default new Auth();