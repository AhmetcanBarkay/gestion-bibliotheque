interface User {
    id: number;
    username: string;
    hashedPassword: string;
    token: string;
    role: 'admin' | 'bibliothecaire';
    date_created: Date;
};
export default User;