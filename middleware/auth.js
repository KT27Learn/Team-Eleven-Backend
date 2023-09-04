import jwt from 'jsonwebtoken';

const auth = async (req, res, next) => {

    try {

        const token = req.headers.authorization.split("");
        const isCustomAuth = token.length < 500;

        let decodedData;

        if (token && isCustomAuth) {

            //jwt login
            decodedData = jwt.verify(token, process.env.SECRET_TOKEN);
            req.userId = decodedData?.id;

        } else {

            //google login
            decodedData = jwt.decode(token);
            req.userId = decodedData?.sub;
        }

    } catch (error) {

        console.log(error);

    }
}


export default auth;