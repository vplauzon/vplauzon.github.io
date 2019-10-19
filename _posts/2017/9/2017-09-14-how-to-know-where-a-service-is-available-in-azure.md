---
title:  How to know where a Service is Available in Azure
date:  2017-09-14 12:00:39 -04:00
permalink:  "/2017/09/14/how-to-know-where-a-service-is-available-in-azure/"
categories:
- Solution
tags:
- Automation
- PowerShell
---
<a href="http://vincentlauzon.files.wordpress.com/2017/09/pexels-photo-2696331.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="pexels-photo-269633[1]" src="http://vincentlauzon.files.wordpress.com/2017/09/pexels-photo-2696331_thumb.jpg" alt="pexels-photo-269633[1]" width="370" height="245" align="right" border="0" /></a>Azure has a Global Footprint of <a href="https://azure.microsoft.com/en-us/regions/" target="_blank" rel="noopener">40 regions</a> at the time of this writing (mid-September 2017).

Not all services are available in every regions.  Most aren’t in fact.  Only foundational services (e.g. storage) are available everywhere.

In order to know where a service is available, we can look at:

<a title="https://azure.microsoft.com/en-us/regions/services/" href="https://azure.microsoft.com/en-us/regions/services/">https://azure.microsoft.com/en-us/regions/services/</a>

This is handy when we’re building an architecture or a quote.

What if we want to build some automation around the availability of a service or simply check it via PowerShell because opening a browser is too hard today?

There are really 2 ways to get there.  Either we look at a specific region and query that services are in there or we look at a service and query where it’s available.
<h2>Provider Model</h2>
Services aren’t “first class citizens” in Azure.  <a href="https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-overview#resource-providers" target="_blank" rel="noopener">Resource Providers</a> are.

Each resource provider offers a set of resources and operations for working with an Azure service.
<h2>Where is my service available?</h2>
Let’s start by finding the regions where a given service is available.

The key PowerShell <em>cmdlet</em> is Get-AzureRmResourceProvider.

Let’s start by finding the service we’re interested at.

[code language="PowerShell"]

Get-AzureRmResourceProvider | select ProviderNamespace

[/code]

This returns the name of all the Azure provider namespaces (around 40 at the time of this writing).

Let’s say we are interested in <em>Microsoft.DataLakeStore</em>.

[code language="PowerShell"]

Get-AzureRmResourceProvider -ProviderNamespace Microsoft.DataLakeStore

[/code]

This returns the resource providers associated with the given namespace.

We now need to pick the one with the resource types interesting us.  In this case, let’s say, we are interested in Azure Data Lake Store accounts (the core resource for the service).  We can see it’s available in three regions:

[code language="PowerShell"]

ProviderNamespace : Microsoft.DataLakeStore
RegistrationState : Registered
ResourceTypes     : {accounts}
Locations         : {East US 2, North Europe, Central US}

[/code]

<h2>Which services are available in my region?</h2>
Now, let’s take the opposite approach.  Let’s start with a region and see what services are available in there.

Here the key cmdlet is Get-AzureRmLocation

[code language="PowerShell"]

Get-AzureRmLocation | select Location

[/code]

This lists the region we have access to.  A user rarely have access to all region which is why the list you see likely is smaller than 40 items at the time of this writing.

Let’s look at what’s available close to my place, <em>canadaeast</em>.

[code language="PowerShell"]

Get-AzureRmLocation | where {$_.Location -eq &quot;canadaeast&quot;} | select -ExpandProperty Providers

[/code]

This gives us a quick view of what’s available in a region.
<h2>Summary</h2>
We saw how to query Azure REST API using PowerShell in order to know where a service is available or what services are available in a region.

This could be especially useful if we want to automate such a check or doing more sophisticated queries, e.g. which region have service X &amp; Y available?