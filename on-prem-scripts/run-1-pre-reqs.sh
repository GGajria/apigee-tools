#!/bin/bash

# Apigee installation commands in a script
# This script must be run as the root user
yum makecache fast

# install java
yum install java-1.8.0-openjdk-devel.x86_64

# verify java installation
java -version

# set secure linux mode to permissive. After installation, turn this back on (ie. setenforce 1)
setenforce 0

# set the proxy  
export http_proxy=http://proxy.{org}.com:8080
export https_proxy=http://proxy.{org}.com:8080
export no_proxy=127.0.0.1,localhost,$(hostname -i)

# get the Extra packagaes for enterprise linux (required for apigee-setup)
wget https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm; sudo rpm -ivh epel-release-latest-7.noarch.rpm

# enable additional yum packages 
yum-config-manager --enable ol7_optional_latest

# install required packages
yum install yum-utils
yum install yum-plugin-priorities

# get apigee bootstrap and systems check
curl https://software.apigee.com/bootstrap_4.18.05.sh -o /tmp/bootstrap_4.18.05.sh

# run the systems check with the apigee provided username/password
bash /tmp/bootstrap_4.18.01.sh apigeeuser={username} apigeepassword={password}

# validate yum settings
cat /etc/yum.repos.d/apigee.repo
yum -v repolist 'apigee*'

# install the apigee-srtup utility
/opt/apigee/apigee-service/bin/apigee-service apigee-setup install

