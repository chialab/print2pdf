ARG PUPPETEER_VERSION=latest
FROM alekzonder/puppeteer:$PUPPETEER_VERSION

COPY package.json package-lock.json /app/
RUN npm install --production
COPY index.js print.js server.js schema.json /app/

EXPOSE 8080

CMD [ "node", "index.js", "server" ]
