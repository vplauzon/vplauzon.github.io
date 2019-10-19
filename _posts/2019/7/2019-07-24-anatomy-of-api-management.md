---
title:  Anatomy of API Management
date:  2019-07-24 06:30:04 -04:00
permalink:  "/2019/07/24/anatomy-of-api-management/"
categories:
- Solution
tags:
- API
---
<img style="float:left;padding-right:20px;" title="From pixabay.com" src="https://vincentlauzon.files.wordpress.com/2019/07/brain-3168269_640-e1562960414388.png" />

When I want to wrap my head around a non-trivial Azure service with a few moving parts, I like to draw a diagram.

That might be from my <a href="https://en.wikipedia.org/wiki/Unified_Modeling_Language">UML</a> days or it might just be that I reason better with boxes that concepts spread in documentation and APIs.  In general, it helps me clear out the parts and how they relate to each other.

I wrote a few <a href="https://vincentlauzon.com/?s=anatomy">anatomy articles</a>.  This one is for <a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-key-concepts">Azure API Management</a>, a fully managed <a href="https://www.quora.com/What-is-an-API-gateway">API Gateway</a> service.

The diagram doesn't contain every single <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.apimanagement/2019-01-01/service">sub-resources of API management</a>, just the main ones.  Each object relates to an Azure Resource (in ARM sense).

<h2>API Management Anatomy</h2>

<img src="https://vincentlauzon.files.wordpress.com/2019/07/apimanagement.png" alt="API Management Anatomy" />

We see the <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.apimanagement/2019-01-01/service">API Management Service</a> in the middle, a little darker.  This is the actual API Management instance.  It has a SKU (e.g. consumption, standard, premium), a list of additional locations (to geo distribute it) and a VNET config (to integrate it to an existing VNET).

The API Management Service has <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.apimanagement/2019-01-01/service/groups/users">users</a> and <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.apimanagement/2019-01-01/service/groups">groups</a>.

The service can also have <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.apimanagement/2019-01-01/service/subscriptions">subscriptions</a>.  Those subscriptions are scoped at the service level and give access to all APIs.

The service also has <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.apimanagement/2019-01-01/service/products">products</a>.  Products can also have subscriptions.  With that scope, the subscriptions only give access to the APIs associated to the products.

<a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.apimanagement/2019-01-01/service/apis">APIs</a> are associated in a many-to-many fashion to products.  API is the level where the versioning happens.

An API can have <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.apimanagement/2019-01-01/service/apis/operations">operations</a>.  An operation maps to a back-end API.

<a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.apimanagement/2019-01-01/service/policies">Policies</a> can exist at the Product, API or operation level.  Hence the <em>base</em> policy:  it represents the higher level policies.

<h2>Summary</h2>

That's it.

I didn't want to over complicate things.  I hope it gives a bit of insights on API Management in the form of a one-pager.