FROM alpine:latest AS base

ENV HUGO_SITE=/srv/hugo

# Install dependencies - nodejs and npm
RUN apk --no-cache add \
    git \
    hugo \
    nodejs \
    npm \
    && mkdir -p ${HUGO_SITE} \
    && rm -rf /tmp/*

RUN git init
WORKDIR ${HUGO_SITE}

#copy package.json first to leverage Docker caching
COPY package.json package-lock.json* ${HUGO_SITE}/

RUN npm install --legacy-peer-deps

COPY .gitmodules ${HUGO_SITE}/.gitmodules
COPY .git ${HUGO_SITE}/.git
RUN git submodule update --init --recursive

COPY . ${HUGO_SITE}

# Build CSS from SCSS
RUN npm run build:css

RUN hugo --minify

FROM nginx:alpine
COPY --from=base /srv/hugo/public /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
