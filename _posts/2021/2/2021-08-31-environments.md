---
title:  Automated deployments in Azure Data Explorer
permalink: /2021/08/31/environments-in-adx
categories:
- Solution
hidden:  true
tags:
- Data
- DevOps
---

Automated deployment is a critical part of DevOps / DataOps and enables us to:

*   Easily maintain multiple [environments](https://en.wikipedia.org/wiki/Deployment_environment)
*   Keep traces of deployment
*   More easily rollback
*   Shorten development lifecycle
*   Implement Continuous Integration / Continuous Deployment (CI / CD)
*   Facilitates automated testing

In this article, we'll look at different facets of deployment with Azure Data Explorer.

An Azure Data Explorer cluster is the main Azure Resource Manager (ARM) resource.  It has a few children resources such as databases & data connections.

Kusto Schema Entities such as tables, materialized views, functions, policies, etc. aren't controlled by ARM.  The are controlled by Azure Data Explorer *data plane*.  They can be created and updated via [Control Commands](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/).

# ARM Templates

[Azure Resource Manager Templates](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/) (ARM Templates) are JSON files defining the infrastructure and configuration of a deployment.

[Bicep](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview) is a domain-specific language (DSL) that uses declarative syntax to deploy Azure resources. It provides concise syntax, reliable type safety, and support for code reuse.

* [Create an Azure Data Explorer cluster and database by using an Azure Resource Manager template](https://docs.microsoft.com/en-us/azure/data-explorer/create-cluster-database-resource-manager)
* [Microsoft.Kusto clusters ARM resource JSON schema](https://docs.microsoft.com/en-us/azure/templates/microsoft.kusto/clusters?tabs=json)
* [Microsoft.Kusto clusters ARM resource Bicep schema](https://docs.microsoft.com/en-us/azure/templates/microsoft.kusto/clusters?tabs=bicep)

# Terraform

TODO (Reference a GitHub repo with a Terraform configuration?)

# Imperative deployment

ARM & Terraform are the two main declarative ways to create Azure Data Explorer infrastructure.

Infrastructure can also be created imperatively using different platforms:

* [Azure CLI](https://docs.microsoft.com/en-us/azure/data-explorer/create-cluster-database-cli)
* [PowerShell](https://docs.microsoft.com/en-us/azure/data-explorer/create-cluster-database-powershell)
* [C# SDK](https://docs.microsoft.com/en-us/azure/data-explorer/create-cluster-database-csharp)
* [Python SDK](https://docs.microsoft.com/en-us/azure/data-explorer/create-cluster-database-python)
* [Go SDK](https://docs.microsoft.com/en-us/azure/data-explorer/create-cluster-database-go)

# Kusto Schema Entities

Kusto Schema Entities are created / updated by running Kusto scripts consisting of [Control Commands](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/).

There are many ways to automate this:

TODO:  Need to validate the 'scripts' resource approach

*   Using ARM Microsoft.Kusto clusters/databases/scripts resource
  * [ARM JSON](https://docs.microsoft.com/en-us/azure/templates/microsoft.kusto/clusters/databases/scripts?tabs=json)
  * [ARM Bicep](https://docs.microsoft.com/en-us/azure/templates/microsoft.kusto/clusters/databases/scripts?tabs=bicep)
  * Terraform (TODO)
* [Kusto CLI](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/tools/kusto-cli) in *script mode*
* SDK
    * [C# SDK](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/netfx/about-kusto-data)
    * [Python SDK](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/python/kusto-python-client-library)
    * [Java SDK](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/java/kusto-java-client-library)
    * [Node SDK](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/node/kusto-node-client-library)
    * [Go SDK](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/golang/kusto-golang-client-library)

# Data Connections

...

# Data
