#!/usr/bin/env bash
#(@)generate-CA.sh - Create CA key-pair and server key-pair signed by CA

# Copyright (c) Karla Falcao <karlapsfalcao()gmail.com>
# All rights reserved.
#
GITHUB_GIST=https://gist.githubusercontent.com/karlafalcao/b41ea7c1fbbad90dee1d3977f033e21f
curl -s ${GITHUB_GIST}/raw/8aec151f1b0706cc5e8e4a08e0adf016ed1c5cbd/generate-CA.sh | bash