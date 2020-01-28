---
title: Using Application Gateway with VNET peering
date: 2017-11-20 03:30:23 -08:00
permalink: /2017/11/20/using-application-gateway-with-vnet-peering/
categories:
- Solution
tags:
- Networking
- Web
---
<a href="/assets/posts/2017/4/using-application-gateway-with-vnet-peering/pexels-photo-3747101.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="pexels-photo-374710[1]" src="/assets/posts/2017/4/using-application-gateway-with-vnet-peering/pexels-photo-3747101_thumb.jpg" alt="pexels-photo-374710[1]" width="320" height="211" align="right" border="0" /></a>As I write these lines (early November 2017), Application Gateway doesn’t integrate well across VNET peering.

More precisely, if we put the gateway in a VNET and have scale sets in another, the usual integration, where the scale set registers its VM automatically as the size of the set evolves, doesn’t work.

In this article, we’ll look at a workaround.  This shortcoming is likely going to be fixed in the future and I’m going to update this post when it is the case.

The code used in this article is <a href="https://github.com/vplauzon/app-gateway/tree/master/multi-vnets-vmss" target="_blank" rel="noopener">available on GitHub</a>.
<h2>What is Azure Application Gateway</h2>
Before we start, a quick recall.  From <a href="https://docs.microsoft.com/en-us/azure/application-gateway/application-gateway-create-gateway-arm">the official documentation</a>:

<em>Application Gateway is a layer-7 load balancer.  It provides failover, performance-routing HTTP requests between different servers, whether they are on the cloud or on-premises. Application Gateway provides many Application Delivery Controller (ADC) features including HTTP load balancing, cookie-based session affinity, Secure Sockets Layer (SSL) offload, custom health probes, support for multi-site, and many others.</em>

I like to say that it is at time a Reverse Proxy, a Web Application Firewall (WAF) and a layer 7 load balancer.

In a previous article, we’ve looked at the <a href="https://vincentlauzon.com/2017/07/17/azure-application-gateway-anatomy/">anatomy of the Application Gateway</a>.  We are going to leverage that knowledge here.
<h2>Workaround</h2>
The workaround basically consist in having an ARM template where the Scale Set aren’t attached to the Application Gateway and use a PowerShell script to register each scale set instance (i.e. VM) to the Application Gateway afterwards.

For Scale Set where the size of the set (i.e. the number of instances, or number of VMs) do not change much, this solution is ok.  When a Scale Set is on auto scale and the number of instances change regularly, it is important to run that script often (e.g. by using <a href="https://vincentlauzon.com/2015/11/01/azure-runbook-a-complete-simple-example/">Azure Automation / Runbooks</a>).

For our example, we took the code from a <a href="https://vincentlauzon.com/2017/05/08/url-routing-with-azure-application-gateway/">past article</a> and modify it for VNET peering.

As previously mentioned, our <a href="https://github.com/vplauzon/app-gateway/tree/master/multi-vnets-vmss" target="_blank" rel="noopener">code is available on GitHub</a>.

Here is an example of PowerShell script that goes in each Scale Set and register the instances to the application gateway (code is in <a href="https://github.com/vplauzon/app-gateway/blob/master/multi-vnets-vmss/UpdateBackendPools.ps1" target="_blank" rel="noopener">UpdateBackendPools.ps1</a>)

```PowerShell
$resourceGroupName = "appgw"
$appGatewayName = "AppGateway"
#  Map between the backend pool names of the Application gateway and the scale set names
$backendPoolToScaleSetNameMap = @{
"backendPool" = "app-a-Pool";
"scaleSet" = "App-A"
},
@{
"backendPool" = "app-b-Pool";
"scaleSet" = "App-B"
},
@{
"backendPool" = "app-c-Pool";
"scaleSet" = "App-C"
}

#  Fetch Application Gateway object
$ag = Get-AzureRmApplicationGateway -ResourceGroupName $resourceGroupName -Name $appGatewayName

$backendPoolToScaleSetNameMap | foreach{
$backendPoolName = $_.backendPool
$setName = $_.scaleSet

#  Fetch IPs from the NICs attached to specified VMSS
$ips = Get-AzureRmNetworkInterface -ResourceGroupName $resourceGroupName -VirtualMachineScaleSetName $setName |
foreach {$_.IpConfigurations[0].PrivateIpAddress}
#  Update Application Gateway object with ips
$ag = Set-AzureRmApplicationGatewayBackendAddressPool -ApplicationGateway $ag -Name $backendPoolName `
-BackendIPAddresses $ips
}

#  Update Application Gateway resource with the object
Set-AzureRmApplicationGateway -ApplicationGateway $ag
```

<h2>Other Updates</h2>
A major drawback of this approach is that we can’t use the ARM template to update the Application Gateway anymore.

Since the ARM template contains no VM registration, running it would flush the configuration done by the script in the previous section.  We could run the script afterwards but during the transition the Application Gateway wouldn’t serve any requests.

We therefore need to those updates using PowerShell.

As an example, here we add a URL map rule (see <a href="https://github.com/vplauzon/app-gateway/blob/master/multi-vnets-vmss/ChangeRule.ps1" target="_blank" rel="noopener">ChangeRule.ps1</a>):

```PowerShell
$resourceGroupName = "appgw"
$appGatewayName = "AppGateway"

#  Fetch Application Gateway object
$ag = Get-AzureRmApplicationGateway -ResourceGroupName $resourceGroupName -Name $appGatewayName

#  Grab backend address pools (A, B, C)
$backendAddressPoolA = $ag.BackendAddressPools | where {$_.Name -eq "app-a-Pool"}
$backendAddressPoolB = $ag.BackendAddressPools | where {$_.Name -eq "app-b-Pool"}
$backendAddressPoolC = $ag.BackendAddressPools | where {$_.Name -eq "app-c-Pool"}

#  Grab http settings (in our case, there is only one)
$backendHttpSetting = $ag.BackendHttpSettingsCollection[0]

#  Grab existing rules
$rules = $ag.UrlPathMaps[0].PathRules

#  Create a new rule, "rule-D"
$newRule = New-AzureRmApplicationGatewayPathRuleConfig -Name "rule-D" -Paths "/d/*" `
-BackendAddressPoolId $backendAddressPoolA.Id `
-BackendHttpSettingsId $backendHttpSetting.Id

#  Add the rule to existing rules (inplace)
$rules.Add($newRule)

#  Update Application Gateway resource with the object
Set-AzureRmApplicationGateway -ApplicationGateway $ag
```

<h2>Summary</h2>
This workaround is fastidious and breaks the concept of using ARM template both to create and update a deployment.  But until this limitation is lifted, it is the only way to work with Application Gateway routing traffic across peered VNETs.

We gave a few examples of PowerShell scripts used to manipulate the Application Gateway.

In general, the approach is to load the Application Gateway object, manipulate it and call Set-AzureRmApplicationGateway to propagate all the changes.