FROM node:10.15.0-slim@sha256:bb4a5a0bdc9886b180d52b556b1e3f3f624bc8c13d50bd3edca1dbeb7aa7ac0b
LABEL name="pokemon-quizzer"

# Set the working directory
WORKDIR /usr/src

# Copy all files to the working directory
COPY . .

# Copy package manager files to the working directory and run install
RUN npm install

# Build the app and move the resulting build to the `/public` directory
RUN npm run now-build
