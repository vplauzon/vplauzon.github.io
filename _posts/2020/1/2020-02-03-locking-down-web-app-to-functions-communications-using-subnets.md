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

Serverless compute typically offers less networking options since it does not run on dedicated compute.

Until recently, the only option to lock down access to a function was to lock down the function's firewall to some public IPs.  That isn't always useful when the caller doesn't have a fixed and unique Public IP.  A lot of Platform as a Service (PaaS) share the same public IP.  For instance, Azure App Service share the outbound public IPs among many tenants.

In the last couple of months, new features are now allowing us to do more.  In this article, we will show in this article that we can easily implement the following pattern:

![target implementation](/assets/posts/2020/1/locking-down-web-app-to-functions-communications-using-subnets/function-networking.png)

That is, we'll lock down the communication between two functions using a subnet.  No more public IPs shared with other customers.  This will not be using [App Service Environment](https://docs.microsoft.com/en-us/azure/app-service/environment/intro) (ASE) or [Azure Function Premium](https://docs.microsoft.com/en-us/azure/azure-functions/functions-premium-plan).  Just plain old public Azure Functions.

The only constraint we have is to have the function initiating the communication (Function A in our case) to be in a Standard (or above) App Service Plan.

Everything we do here can also be done with a web site in Azure App Service.

As usual the [code is on GitHub](https://github.com/vplauzon/function/tree/master/lock-in-subnet).

## Deploy Solution

First, let's deploy the solution:

[![Deploy button](http://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Ffunction%2Fmaster%2Flock-in-subnet%2Fdeploy.json)

No parameters are required, only a resource group.

After the deployment is completed we should have the following resources:

![Resources](/assets/posts/2020/1/locking-down-web-app-to-functions-communications-using-subnets/resources.png)

We'll look at those resources in order to explore the solution.

## Service Endpoint

Let's start with *function-app-b-XYZ* (the suffix varies depending on the deployment).

![Function b](/assets/posts/2020/1/locking-down-web-app-to-functions-communications-using-subnets/function-b.png)

We can see something is wrong.

If we try to run the function, we'll hit an error.

Let's open the networking configuration for the function app.

![Networking](/assets/posts/2020/1/locking-down-web-app-to-functions-communications-using-subnets/networking.png)

Let's then open the *access restriction* configuration.

![Access Restriction](/assets/posts/2020/1/locking-down-web-app-to-functions-communications-using-subnets/access-restriction.png)

We can then see the rules defined to restrict the access:

![Rules](/assets/posts/2020/1/locking-down-web-app-to-functions-communications-using-subnets/rules.png)

The first rule lets only the default subnet of the vnet *vnet* access the function app.  The second rule forbids everything else.

This is basically a [Service Endpoint](https://vincentlauzon.com/2019/04/18/multiple-service-endpoints-to-multiple-services/).

The reason we can't run the function is because we aren't in the subnet.  If we would access the portal from a VM sitting in that VNET, that would work.

Now Azure App Service (and therefore functions) supports [Service Endpoint](https://docs.microsoft.com/en-us/azure/app-service/app-service-ip-restrictions#service-endpoints).

## VNET Integration

https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet

