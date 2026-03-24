interface User {
    id: number;
    username: string;
    hashedPassword: string;
    token: string;
    role: 'admin' | 'bibliothecaire' | 'client';
    date_created: Date;
};
export default User;