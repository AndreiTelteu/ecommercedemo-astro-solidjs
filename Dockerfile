FROM node:16-bullseye
WORKDIR "/app"
EXPOSE 8080

COPY . .
RUN chown -R node: .
RUN su node -c "yarn install"
RUN su node -c "node package-for-nodejs.js"
RUN su node -c "yarn build"

CMD ["su", "node", "-c", "node ./entrypoint.mjs"]
