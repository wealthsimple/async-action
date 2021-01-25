#!/bin/bash
set -e
set -o pipefail

function error() {
  echo "${1}" 1>&2
  exit 1
}

function setup_project() {
  yarn install
}

function possible_type_dependencies() {
  jq --raw-output \
    '.dependencies + .devDependencies | to_entries | .[] | "@types/" + .key' \
    package.json
}

function has_installable_types() {
  npm view --json "${1}" 2>/dev/null | jq .deprecated | grep --quiet null
}

function installable_type_packages() {
  for possible_type_dependency in $(possible_type_dependencies); do
    if has_installable_types "${possible_type_dependency}"; then
      echo "${possible_type_dependency}"
    fi
  done
}

function add_types_dependencies() {
  local types_dependencies
  types_dependencies="$(installable_type_packages)"
  if [ -n "${types_dependencies}" ]; then
    echo "${types_dependencies}" | xargs yarn add --dev
  fi
}

function remove_flow_dependencies() {
  local flow_dependencies
  flow_dependencies="$(jq --raw-output '.dependencies + .devDependencies | keys | .[] | select(contains("flow") or contains("babel"))' package.json)"
  if [ -n "${flow_dependencies}" ]; then
    echo "${flow_dependencies}" | xargs yarn remove
  fi
}

function add_typescript_dependencies() {
  yarn add --dev \
    typescript \
    @typescript-eslint/parser \
    @typescript-eslint/eslint-plugin \
    ts-jest
}

function add_formatting_dependencies() {
  yarn add --dev \
    prettier \
    eslint-config-prettier \
    eslint-plugin-prettier
}

function remove_flow_support() {
  rm -rf flow-typed/ .flowconfig babel-register.js babel.config.js
}

function remove_empty_files() {
  for directory in jest src; do
    find "${directory}" -type f -empty -delete
  done
}

function add_converted_internal_dependencies() {
  echo "No converted internal dependencies to add - skipping."
}

function configure_typescript() {
  if [ -f tsconfig.json ]; then
    rm tsconfig.json
  fi

  # Development configuration
  cat <<EOF > tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "esModuleInterop": true,
    "lib": ["ES5"],
    "module": "commonjs",
    "moduleResolution": "node",
    "noEmit": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ES5"
  }
}
EOF

  # Production configuration
  cat <<EOF > tsconfig.build.json
{
  "extends": "./tsconfig",
  "compilerOptions": {
    "declaration": true,
    "noEmit": false,
    "outDir": "./dist",
  },
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "**/__mocks__/*"]
}
EOF
  
  # Publish TS version under a different package name until we have the full
  # stack sorted out.  
  jq 'del(.jest)' package.json \
    | jq 'del(.scripts.flow)' \
    | jq 'del(.scripts."build:copy-files")' \
    | jq '.name = "@wealthsimple/async-action-ts"' \
    | jq '.scripts.check_types = "tsc"' \
    | jq '.scripts.prettier = "prettier --write \"./+(src)/**/*.ts\""' \
    | jq '.scripts.build = "tsc -p tsconfig.build.json"' \
    > package.json.tmp

  mv package.json.tmp package.json
}

function configure_jest() {
  cat <<EOF > jest.config.js
module.exports = {
  coverageDirectory: "coverage",
  coverageReporters: [
    "lcov"
  ],
  collectCoverageFrom: [
    "**/src/**/*.{ts,tsx}"
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/jest/",
    "/doc/",
    "/env/",
    "/dist/",
    "/fixtures/",
    "/src/project-env.ts",
    "/migrations/"
  ],
  modulePathIgnorePatterns: [
    "/.yarn-cache/",
    "/jmeter/"
  ],
  preset: "ts-jest",
  roots: ["src"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist",
    "/initializers/",
    "impersonate.ts",
    "project-env.ts",
    "repl.ts"
  ],
  testEnvironment: "jsdom"
};
EOF
}

function configure_eslint() {
  if [ -f .eslintrc ]; then
    rm .eslintrc
  fi

  # update eslint, use minimal plugins for a non-react repo.
  yarn remove eslint eslint-config-airbnb eslint-config-airbnb-base eslint-config-prettier eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-prettier eslint-plugin-react
  yarn add eslint
  
  cat <<EOF > .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  "parser": "@typescript-eslint/parser",
  "rules": {
    "@typescript-eslint/ban-ts-comment": [
      "error",
      { "ts-ignore": "allow-with-description" }
    ],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-empty-function": "off"
  }
}
EOF
}

function format() {
  yarn run prettier --write .
}

function install_ts_migrate() {
  yarn add --dev ts-migrate
}

function migrate() {
  yarn add --dev flowts

  yarn flowts ./src
  yarn flowts ./db
  yarn flowts ./jest
  yarn flowts ./env
  yarn flowts ./migrations
}

function expect_errors() {
  yarn ts-migrate reignore .
}

function update_snapshots() {
  yarn jest -u
}

function check_types() {
  yarn tsc --noEmit
}

function cleanup_dependencies() {
  yarn remove ts-migrate flowts
  yarn add --dev yarn-deduplicate
  yarn yarn-deduplicate
}

function lint_fix() {
  yarn lint --fix --quiet || true
}

function lint() {
  yarn lint --quiet
}

if git diff --quiet; then
  setup_project
  remove_flow_dependencies
  remove_flow_support
  add_typescript_dependencies
  add_types_dependencies
  add_formatting_dependencies
  add_converted_internal_dependencies
  configure_eslint
  configure_jest
  remove_empty_files
  configure_typescript
  install_ts_migrate
  migrate
  format
  lint_fix
  expect_errors
  check_types
  update_snapshots
  lint
  cleanup_dependencies
else
  error "There are uncommitted changes. Run this on a clean checkout."
fi
