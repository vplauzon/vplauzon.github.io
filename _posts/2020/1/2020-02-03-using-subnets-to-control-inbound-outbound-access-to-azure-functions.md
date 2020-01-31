---
title: Locking down Web App to Functions communications using subnets
permalink: /2020/02/03/locking-down-web-app-to-functions-communications-using-subnets
categories:
- Solution
tags:
    - Security
    - Serverless
    - Networking
date: 2020-01-28
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/1/locking-down-web-app-to-functions-communications-using-subnets/buckets.jpg" />

[Azure Functions](https://docs.microsoft.com/en-us/azure/azure-functions/functions-overview) are serverless [Function as a Service](https://en.wikipedia.org/wiki/Function_as_a_service).

Typically serverless compute offer less networking options since they do not run on compute dedicated to customer.

Until recently, the only option was to lock down the function's firewall to some public IPs.  That isn't very useful when 2 functions are speaking to each other since functions doesn't have a unique outbound public IP:  multiple functions share the same public IP.

In the last couple of months, there are features that now allow us to do more.  In this article, we will show in this article that we can easily implement the following pattern:

![target implementation](/assets/posts/2020/1/locking-down-web-app-to-functions-communications-using-subnets/function-networking.png)

That is, we'll lock down the communication between two functions using a subnet.  No more public IPs shared with other customers.  This will not be using [App Service Environment](https://docs.microsoft.com/en-us/azure/app-service/environment/intro) (ASE) or [Azure Function Premium](https://docs.microsoft.com/en-us/azure/azure-functions/functions-premium-plan).  Just plain old public Azure Functions.

Everything we do here can also be done with a web site in Azure App Service.

As usual the [code is on GitHub](https://github.com/vplauzon/function/tree/master/lock-in-subnet).

## Deploy Solution

https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet

https://docs.microsoft.com/en-us/azure/app-service/app-service-ip-restrictions#service-endpoints