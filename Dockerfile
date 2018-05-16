ARG PUPPETEER_VERSION
FROM alekzonder/puppeteer:${PUPPETEER_VERSION:-latest}

COPY package.json package-lock.json /app/
RUN npm install --production
COPY index.js print.js /app/

CMD [ "node", "index.js" ]
