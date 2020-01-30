---
title: Using subnets to control inbound/outbound access to Azure Functions
permalink: /2020/02/03/using-subnets-to-control-inbound-outbound-access-to-azure-functions
categories:
- Solution
tags:
    - Security
    - Serverless
    - Networking
date: 2020-01-28
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/1/using-subnets-to-control-inbound-outbound-access-to-azure-functions/buckets.jpg" />

[Azure Functions](https://docs.microsoft.com/en-us/azure/azure-functions/functions-overview) are serverless [Function as a Service](https://en.wikipedia.org/wiki/Function_as_a_service).

Typically serverless compute offer less networking options since they do not run on compute dedicated to customer.

But with 