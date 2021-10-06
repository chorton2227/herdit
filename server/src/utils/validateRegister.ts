import { RegisterInput } from "src/resolvers/RegisterInput"

export const validateRegister = (options: RegisterInput)  => {
    if (options.username.length <= 2) {
        return [{
            field: "username",
            message: "Length must be greater 2."
        }];
    }

    if (options.username.includes('@')) {
        return [{
            field: "username",
            message: "Must not contain @."
        }];
    }

    if (options.password.length <= 3) {
        return [{
            field: "password",
            message: "Length must be greater 3."
        }];
    }

    if (!options.email.includes('@')) {
        return [{
            field: "email",
            message: "Invalid email address."
        }];
    }

    return null;
}