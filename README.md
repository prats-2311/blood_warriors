<p align=center>
  <img src=https://img.shields.io/badge/node-v10.16.0-brightgreen.svg?style=flat-square alt="node" />
  <img src=https://img.shields.io/badge/npm-v5.6.0-blue.svg?style=flat-square alt="npm" />
  <a href=https://github.com/blood-warriors/blood-warriors/blob/master/LICENSE>
    <img src=https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square alt="License: MIT" />
  </a>
  <a href=https://github.com/blood-warriors/blood-warriors/blob/master/.github/contributing.md>
    <img src=https://img.shields.io/badge/contributions-welcome-orange.svg?style=flat-square alt="Contributions Welcome" />
  </a>
  <a href=https://vercel.com>
    <img src=https://img.shields.io/badge/Powered_by-Vercel-black?style=flat-square alt="Powered by Netlify">
  </a>
</p>

# Blood Warriors - Blood Donation Platform

A simple and clean blood donation platform built with Next.js.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You will need the following properly installed on your computer.

- [Git](http://git-scm.com/)
- [Node](http://nodejs.org/)
- [NVM](https://github.com/creationix/nvm)
- [NextJS](https://nextjs.org/)

## Installing

In a terminal window run these commands.

```sh
$ git clone https://github.com/blood-warriors/blood-warriors.git
$ cd blood-warriors
$ nvm install
$ npm install
$ npm run dev
```

You should be able to view the website locally at `http://localhost:3000/`.

## Features

- User Registration & Authentication
- Patient and Donor profiles
- Simple dashboard
- Clean, responsive UI

## Tech Stack

- **Frontend**: Next.js
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Testing

In a terminal window run these commands.

```sh
$ cd blood-warriors
$ npm run test
```

For watch mode:

```sh
$ npm run test:watch
```

To view the coverage report:

```sh
$ npm run test:coverage
$ npm run view:coverage
```

To update snapshots:

```sh
$ npm run test -- --updateSnapshot
```

## Contributing

Please read our contributing guidelines for details on our code of conduct and the process for submitting issues and/or pull requests.

## License

This project is licensed under the MIT License - please see the LICENSE file for more details.
