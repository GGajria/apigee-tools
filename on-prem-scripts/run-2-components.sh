#!/bin/bash

# Apigee components installation script 
# This script must be run as the root user

# set the proxy, just to be safe
export http_proxy=http://proxy.{org}.com:8080
export https_proxy=http://proxy.{org}.com:8080
export no_proxy=127.0.0.1,localhost,$(hostname -i)

# install necessary components. can include multiple componentsi

# r - router
# mp - message processor
# ds - data store (cassandra/zoo keeper)
# ms - management server, openldap and edge-ui
# qs - Apache QPID server
# ps - Postgres server
# sax - Standalone Postgres + QPID server
# aio - All in one 

/opt/apigee/apigee-setup/bin/setup.sh -p ds -f {configFilePath}

# report status
/opt/apigee/apigee-setup/bin/apigee-all status
