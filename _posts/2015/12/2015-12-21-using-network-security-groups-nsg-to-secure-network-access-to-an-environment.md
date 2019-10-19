---
title:  Using Network Security Groups (NSG) to secure network access to an environment
date:  2015-12-21 13:00:07 -05:00
permalink:  "/2015/12/21/using-network-security-groups-nsg-to-secure-network-access-to-an-environment/"
categories:
- Solution
tags:
- Networking
---
Quite a few demos (including mines) ommit security for the sake of simplicity.  One area where you can secure your applications in Azure is in terms of Networking.

Network Security Groups act as a firewall in the cloud.

In this post, I’ll show you how to create a virtual network with 3 subnets:  front-end, middle &amp; back-end.  We’ll then secure network access to those subnets with the following rules:
<ol>
	<li>Front-end can only be accessed on port 80 by anything from the internet</li>
	<li>Front-end can only access the virtual network (not the internet)</li>
	<li>Middle can only be accessed by the front-end on port 80</li>
	<li>Middle can only access the virtual network</li>
	<li>Back-end can only be accessed by the middle on port 1433 (SQL default port)</li>
	<li>Back-end can’t access anything</li>
	<li>Azure Health Monitoring can access everyone (if we don’t allow that, every VMs within the subnet will be marked as unhealthy and be taken down)</li>
</ol>
This is a typical firewall configuration for a 3 tier application:

<a href="assets/2015/12/using-network-security-groups-nsg-to-secure-network-access-to-an-environment/image.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/12/using-network-security-groups-nsg-to-secure-network-access-to-an-environment/image_thumb.png" alt="image" width="461" height="846" border="0" /></a>

We’ll create it in the portal to get the feel of each feature.  At the end, I give you the Azure Resource Manager (ARM) template to generate it at the end.

<strong>So all of this is using Vnet v2 with ARM</strong>.
<h2>Resource Group</h2>
First, we’ll create a new resource group which will contain every artifact.

In the new portal, i.e. <a href="http://portal.azure.com/">http://portal.azure.com/</a>, you can select <em>Resource groups </em>on the left menu.  This will open a blade with all your resource groups listed.  Click the <em>Add</em>  button at the top.

For a resource group name, type whatever you want.  I suggest <strong>NSG</strong>.

Put it in a the region closest to your home.  E.g. East-US.

Hit create, it should take under a minute to create.

Having a resource group is mandatory for creating artefacts in Azure.  Having one for a little POC like this is very useful as you’ll be able to delete the resource group and every artefacts associated to it will be deleted at the same time.

Resource groups are also useful to associate RBAC rules, e.g. given access to a co-worker to a resource group.
<h2>Virtual Network</h2>
Let’s go ahead and create a Virtual Network inside the resource group we just created.

Open the resource group you just created, hit the <em>Add</em>  button then, in the filter text box, type network and hit enter.

Select <em>Virtual Network </em>(Microsoft as Publisher).

At the bottom of the blade, select “Resource Manager” as the deployment model, then hit create.

<a href="assets/2015/12/using-network-security-groups-nsg-to-secure-network-access-to-an-environment/image1.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/12/using-network-security-groups-nsg-to-secure-network-access-to-an-environment/image_thumb1.png" alt="image" width="597" height="181" border="0" /></a>

For the name, type “Poc-Net”.

In address space, type “10.0.0.0/24”.  This is using the <a href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing">Classless Inter-Domain Routing</a> (CIDR, pronounced <em>cider</em>).  This means your virtual network starts at internal address 10.0.0.0 and spans 32-24 (i.e. 8) bits of address space, i.e. 256 addresses (2<sup>8</sup> = 256).

Leave the subnet name as “default”.  This is utterly useless and the first thing we’ll do is delete it.  Same thing for subnet address range.

Leave your subscription there.

Select the resource group we have created.

Ensure the location is the same as resource group and hit create.
<h2>Subnets</h2>
Create the virtual net (vnet) takes a little more time than a resource group.

Once it’s created, open it.  Go to the subnets settings.

<a href="assets/2015/12/using-network-security-groups-nsg-to-secure-network-access-to-an-environment/image2.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/12/using-network-security-groups-nsg-to-secure-network-access-to-an-environment/image_thumb2.png" alt="image" width="1683" height="632" border="0" /></a>

As mention, first thing first:  delete the default subnet.  Select it then delete it.

Let’s create our three subnets:
<table border="3">
<tbody>
<tr>
<td style="background:green;color:white;"><strong>Name</strong></td>
<td style="background:green;color:white;"><strong>Address Range</strong></td>
</tr>
<tr>
<td>Front-end</td>
<td>10.0.0.0/28</td>
</tr>
<tr>
<td>Middle</td>
<td>10.0.0.16/28</td>
</tr>
<tr>
<td>Back-end</td>
<td>10.0.0.32/28</td>
</tr>
</tbody>
</table>
Those three subnets each span a range of 32-28 (4) bits addresses, i.e. 2<sup>4</sup> (16) addresses.

I’m a bit cheap on addresses…  If you need to put more than 16 VMs in each subnet, feel free to grow the address space.

You will have noted that there was the possibility to add Network Security Groups, but since we haven’t created them yet, let’s leave it to <em>None</em> for each subnet.
<h2>Network Security Groups</h2>
Finally, our NSGs!

An NSG in Azure is a stand alone artefact that you associate to subnets or VMs.  You can reuse them on multiple subnets or VMs, although we won’t do that here.

Let’s create our three NSGs, one for each subnet.

In the portal main menu, to the left, click the <em>New</em> button.  Type “Network Security Group” in the filter box, hit enter.  Select <em>Network Security Group</em> (published by Microsoft).  Read and understand every word of the legal statement.  Come on, do it!  No, just kidding.  Click <em>Create</em>.

Give it the name <em>frontEndSecurityGroup</em>.  Make sure you put it in the same resource group.  Hit <em>Create.</em>

Select <em>Inbound security rules.</em>

Inbound rules are the rules to apply to the traffic coming in a subnet or VM.  For the front end we want to allow 2 things:  Http-80 and Azure Health Monitoring.

Let’s add an inbound rule:
<ul>
	<li>Name:  Allow-HTTP</li>
	<li>Priority:  100</li>
	<li>Source:  Tag</li>
	<li>Source Tag:  Internet</li>
	<li>Protocol:  TCP</li>
	<li>Source port range:  *</li>
	<li>Destination:  Any</li>
	<li>Destination port range:  80</li>
	<li>Action:  Allow</li>
</ul>
This is our first rule and it allows all traffic coming from the internet through port 80 using the TCP protocol.

Let’s create another one:
<ul>
	<li>Name:  Allow-Health-Monitoring</li>
	<li>Priority:  200</li>
	<li>Source:  Tag</li>
	<li>Source Tag:  AzureLoadBalancer</li>
	<li>Protocol:  Any</li>
	<li>Source port range:  *</li>
	<li>Destination:  Any</li>
	<li>Destination port range:  *</li>
	<li>Action:  Allow</li>
</ul>
As mentionned, this is to allow Azure Health monitoring to monitor your VMs.

What is the priority?  Rules are apply by priority order until one actually makes sense:  is coming from the defined source &amp; going to the defined destination using the defined protocol.  First rules that makes sense stops the evaluation process.  So if rule 1 makes sense, rule 2 won’t be applied.

Now, for the front end, we allowed everything we wanted to allow.  Let’s disallow everything else as our third rule:
<ul>
	<li>Name:  Disallow-everything-else</li>
	<li>Priority:  300</li>
	<li>Source:  Any</li>
	<li>Protocol:  Any</li>
	<li>Source port range:  *</li>
	<li>Destination:  Any</li>
	<li>Destination port range:  *</li>
	<li>Action:  <strong>Deny</strong></li>
</ul>
This rules will make sure, for instance, that traffic coming from the virtual network can’t get in the front-end subnet (even on port 80).  That is because the first rule only allows traffic coming from the internet.

You should have the following inbound rules:
<table border="3">
<tbody>
<tr style="background:green;font-weight:bold;color:white;">
<td>Priority</td>
<td>Name</td>
<td>Source</td>
<td>Destination</td>
<td>Service</td>
<td>Action</td>
</tr>
<tr>
<td>100</td>
<td>Allow-HTTP</td>
<td>Internet</td>
<td>Any</td>
<td>TCP/80</td>
<td>Allow</td>
</tr>
<tr>
<td>200</td>
<td>Allow-Health-Monitoring</td>
<td>AzureLoadBalancer</td>
<td>Any</td>
<td>Any/Any</td>
<td>Allow</td>
</tr>
<tr>
<td>300</td>
<td>Disallow-everything-else</td>
<td>Any</td>
<td>Any</td>
<td>Any/Any</td>
<td>Deny</td>
</tr>
</tbody>
</table>
For the outbound rule of the front-end, we only allow the front-end to speak to the middle.  We could state it explicitely like this but we’ll enforce that in the middle only.  For the front, we’ll let communication go “anywhere” in the vnet only.  So we’ll have the following outbound rules:
<table border="3">
<tbody>
<tr style="background:green;font-weight:bold;color:white;">
<td>Priority</td>
<td>Name</td>
<td>Source</td>
<td>Destination</td>
<td>Service</td>
<td>Action</td>
</tr>
<tr>
<td>100</td>
<td>Allow-to-VNet</td>
<td>Any</td>
<td>VirtualNetwork</td>
<td>Any/Any</td>
<td>Allow</td>
</tr>
<tr>
<td>200</td>
<td>Deny-All-Traffic</td>
<td>Any</td>
<td>Any</td>
<td>Any/Any</td>
<td>Deny</td>
</tr>
</tbody>
</table>
We will then create a new Network Security Group named <em>middleSecurityGroup</em>.  We’ll define the following inbound rules:
<table border="3">
<tbody>
<tr style="background:green;font-weight:bold;color:white;">
<td>Priority</td>
<td>Name</td>
<td>Source</td>
<td>Destination</td>
<td>Service</td>
<td>Action</td>
</tr>
<tr>
<td>100</td>
<td>Allow-Front</td>
<td>10.0.0.0/28</td>
<td>Any</td>
<td>TCP/80</td>
<td>Allow</td>
</tr>
<tr>
<td>200</td>
<td>Allow-Health-Monitoring</td>
<td>AzureLoadBalancer</td>
<td>Any</td>
<td>Any/Any</td>
<td>Allow</td>
</tr>
<tr>
<td>300</td>
<td>Deny-All-Traffic</td>
<td>Any</td>
<td>Any</td>
<td>Any/Any</td>
<td>Deny</td>
</tr>
</tbody>
</table>
In the first rule we allow traffic coming from a CIDR block corresponding to the front-end subnet, hence only the front end can use this rule.

We then define the following outbound rules:
<table border="3">
<tbody>
<tr style="background:green;font-weight:bold;color:white;">
<td>Priority</td>
<td>Name</td>
<td>Source</td>
<td>Destination</td>
<td>Service</td>
<td>Action</td>
</tr>
<tr>
<td>100</td>
<td>Allow-to-VNet</td>
<td>Any</td>
<td>VirtualNetwork</td>
<td>Any/Any</td>
<td>Allow</td>
</tr>
<tr>
<td>200</td>
<td>Deny-All-Traffic</td>
<td>Any</td>
<td>Any</td>
<td>Any/Any</td>
<td>Deny</td>
</tr>
</tbody>
</table>
Finally, we’ll create a new Network Security Group named <em>backSecurityGroup</em>.  We’ll define the following inbound rules:
<table border="3">
<tbody>
<tr style="background:green;font-weight:bold;color:white;">
<td>Priority</td>
<td>Name</td>
<td>Source</td>
<td>Destination</td>
<td>Service</td>
<td>Action</td>
</tr>
<tr>
<td>100</td>
<td>Allow-Middle</td>
<td>10.0.0.16/28</td>
<td>Any</td>
<td>TCP/1433</td>
<td>Allow</td>
</tr>
<tr>
<td>200</td>
<td>Allow-Health-Monitoring</td>
<td>AzureLoadBalancer</td>
<td>Any</td>
<td>Any/Any</td>
<td>Allow</td>
</tr>
<tr>
<td>300</td>
<td>Deny-All-Traffic</td>
<td>Any</td>
<td>Any</td>
<td>Any/Any</td>
<td>Deny</td>
</tr>
</tbody>
</table>
and the following outbound rules:
<table border="3">
<tbody>
<tr style="background:green;font-weight:bold;color:white;">
<td>Priority</td>
<td>Name</td>
<td>Source</td>
<td>Destination</td>
<td>Service</td>
<td>Action</td>
</tr>
<tr>
<td>100</td>
<td>Deny-All-Traffic</td>
<td>Any</td>
<td>Any</td>
<td>Any/Any</td>
<td>Deny</td>
</tr>
</tbody>
</table>
<h2></h2>
<h2>Attaching NSG to Subnets</h2>
Now that we have our virtual network, subnets &amp; NSGs, we need to associate an NSG to each subnet.

Open the virtual network, select its subnets.  Select <em>front-end</em> subnet and then select <em>Network Security Group</em> (should be at <em>None</em>).  Select <em>frontSecurityGroup</em> and save.

Do the same thing with the other two subnets.

As mentionned, NSG can be associated with more than one subnet / VM and that is why they exist on their own.

There we go.  We have all our rules for a standard three tier architecture network.

If you want to test it, simply put VMs in each subnet and test the connectivity.

…  if you want to this, actually, you’ll need to add rules for allowing inbound TCP:3389 connections for letting your RDP coming in.
<h2>ARM Template</h2>
As promise, here is the ARM template to recreate that.

My best resources for ARM template are:
<ul>
	<li><a href="http://https://azure.microsoft.com/en-us/documentation/articles/resource-group-authoring-templates/">Authoring Azure Resource Manager templates</a></li>
	<li><a href="https://azure.microsoft.com/en-us/documentation/articles/resource-group-template-functions/">Azure Resource Manager template expressions</a></li>
	<li>Azure Resource Explorer (currently in Preview)</li>
</ul>
The last item is a feature of the new portal.  To access it, go on the main left menu &amp; <em>Browse</em>.  Type <em>Resource</em> in the filter and select <em>Resource Explorer</em>.  You’ll be able to browser through your resources and see their ARM template definition.  This <strong>saves heaps of time</strong>.  Be mindful though:  resource explorer will show a couple of attributes you shouldn’t include in your template such as status, id, guids, etc.  .

I’ve used few tricks in this template:
<ul>
	<li>I used variables to define the CIDR of the subnets ; this avoids duplication of the information</li>
	<li>I used the resource group location to dictate the location of all the other resources ; this avoids defining an ultimately redundant parameter</li>
	<li>I used dependsOn &amp; resourceId to attach the Network Security Groups to the subnets.</li>
</ul>

[code language="javascript"]
{
  &quot;$schema&quot;: &quot;https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#&quot;,
  &quot;contentVersion&quot;: &quot;1.0.0.0&quot;,
  &quot;parameters&quot;: {
  },
  &quot;variables&quot;: {
    &quot;cidrNet&quot;: &quot;10.0.0.0/24&quot;,
    &quot;frontNet&quot;: &quot;10.0.0.0/28&quot;,
    &quot;middleNet&quot;: &quot;10.0.0.16/28&quot;,
    &quot;backNet&quot;: &quot;10.0.0.32/28&quot;
  },
  &quot;resources&quot;: [
    {
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;name&quot;: &quot;Poc-Net&quot;,
      &quot;type&quot;: &quot;Microsoft.Network/virtualNetworks&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;dependsOn&quot;: [
        &quot;Microsoft.Network/networkSecurityGroups/frontSecurityGroup&quot;,
        &quot;Microsoft.Network/networkSecurityGroups/middleSecurityGroup&quot;,
        &quot;Microsoft.Network/networkSecurityGroups/backSecurityGroup&quot;
      ],
      &quot;tags&quot;: { },
      &quot;properties&quot;: {
        &quot;addressSpace&quot;: {
          &quot;addressPrefixes&quot;: [
            &quot;[variables('cidrNet')]&quot;
          ]
        },
        &quot;subnets&quot;: [
          {
            &quot;name&quot;: &quot;front-end&quot;,
            &quot;properties&quot;: {
              &quot;addressPrefix&quot;: &quot;[variables('frontNet')]&quot;,
              &quot;networkSecurityGroup&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkSecurityGroups','frontSecurityGroup')]&quot;
              }
            }
          },
          {
            &quot;name&quot;: &quot;middle&quot;,
            &quot;properties&quot;: {
              &quot;addressPrefix&quot;: &quot;[variables('middleNet')]&quot;,
              &quot;networkSecurityGroup&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkSecurityGroups','middleSecurityGroup')]&quot;
              }
            }
          },
          {
            &quot;name&quot;: &quot;back-end&quot;,
            &quot;properties&quot;: {
              &quot;addressPrefix&quot;: &quot;[variables('backNet')]&quot;,
              &quot;networkSecurityGroup&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkSecurityGroups','backSecurityGroup')]&quot;
              }
            }
          }
        ]
      }
    },
    {
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;name&quot;: &quot;frontSecurityGroup&quot;,
      &quot;type&quot;: &quot;Microsoft.Network/networkSecurityGroups&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: { },
      &quot;properties&quot;: {
        &quot;securityRules&quot;: [
          {
            &quot;name&quot;: &quot;Allow-HTTP&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;80&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;Internet&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 100,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          //{
          //  &quot;name&quot;: &quot;Allow-RDP&quot;,
          //  &quot;properties&quot;: {
          //    &quot;protocol&quot;: &quot;Tcp&quot;,
          //    &quot;sourcePortRange&quot;: &quot;*&quot;,
          //    &quot;destinationPortRange&quot;: &quot;3389&quot;,
          //    &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
          //    &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
          //    &quot;access&quot;: &quot;Allow&quot;,
          //    &quot;priority&quot;: 150,
          //    &quot;direction&quot;: &quot;Inbound&quot;
          //  }
          //},
          {
            &quot;name&quot;: &quot;Allow-Health-Monitoring&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;AzureLoadBalancer&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 200,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Disallow-everything-else&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Deny&quot;,
              &quot;priority&quot;: 300,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Allow-to-VNet&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;VirtualNetwork&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 100,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Deny-All-Traffic&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Deny&quot;,
              &quot;priority&quot;: 200,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          }
        ],
        &quot;subnets&quot;: [ ]
      }
    },
    {
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;name&quot;: &quot;middleSecurityGroup&quot;,
      &quot;type&quot;: &quot;Microsoft.Network/networkSecurityGroups&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: { },
      &quot;properties&quot;: {
        &quot;provisioningState&quot;: &quot;Succeeded&quot;,
        &quot;securityRules&quot;: [
          {
            &quot;name&quot;: &quot;Allow-Front&quot;,
            &quot;properties&quot;: {
              &quot;provisioningState&quot;: &quot;Succeeded&quot;,
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;80&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;[variables('frontNet')]&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 100,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          //{
          //  &quot;name&quot;: &quot;Allow-RDP&quot;,
          //  &quot;properties&quot;: {
          //    &quot;protocol&quot;: &quot;Tcp&quot;,
          //    &quot;sourcePortRange&quot;: &quot;*&quot;,
          //    &quot;destinationPortRange&quot;: &quot;3389&quot;,
          //    &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
          //    &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
          //    &quot;access&quot;: &quot;Allow&quot;,
          //    &quot;priority&quot;: 150,
          //    &quot;direction&quot;: &quot;Inbound&quot;
          //  }
          //},
          {
            &quot;name&quot;: &quot;Allow-Health-Monitoring&quot;,
            &quot;properties&quot;: {
              &quot;provisioningState&quot;: &quot;Succeeded&quot;,
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;80&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;AzureLoadBalancer&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 200,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Deny-Everything-Else&quot;,
            &quot;properties&quot;: {
              &quot;provisioningState&quot;: &quot;Succeeded&quot;,
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;80&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Deny&quot;,
              &quot;priority&quot;: 300,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Allow-to-VNet&quot;,
            &quot;properties&quot;: {
              &quot;provisioningState&quot;: &quot;Succeeded&quot;,
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;80&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;VirtualNetwork&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 100,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Deny-All-Traffic&quot;,
            &quot;properties&quot;: {
              &quot;provisioningState&quot;: &quot;Succeeded&quot;,
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;80&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Deny&quot;,
              &quot;priority&quot;: 200,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          }
        ],
        &quot;subnets&quot;: [ ]
      }
    },
    {
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;name&quot;: &quot;backSecurityGroup&quot;,
      &quot;type&quot;: &quot;Microsoft.Network/networkSecurityGroups&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: { },
      &quot;properties&quot;: {
        &quot;securityRules&quot;: [
          {
            &quot;name&quot;: &quot;Allow-Middle&quot;,
            &quot;properties&quot;: {
              &quot;provisioningState&quot;: &quot;Succeeded&quot;,
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;1433&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;[variables('middleNet')]&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 100,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          //{
          //  &quot;name&quot;: &quot;Allow-RDP&quot;,
          //  &quot;properties&quot;: {
          //    &quot;protocol&quot;: &quot;Tcp&quot;,
          //    &quot;sourcePortRange&quot;: &quot;*&quot;,
          //    &quot;destinationPortRange&quot;: &quot;3389&quot;,
          //    &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
          //    &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
          //    &quot;access&quot;: &quot;Allow&quot;,
          //    &quot;priority&quot;: 150,
          //    &quot;direction&quot;: &quot;Inbound&quot;
          //  }
          //},
          {
            &quot;name&quot;: &quot;Allow-Health-Monitoring&quot;,
            &quot;properties&quot;: {
              &quot;provisioningState&quot;: &quot;Succeeded&quot;,
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;80&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;AzureLoadBalancer&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 200,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Deny-Everything-Else&quot;,
            &quot;properties&quot;: {
              &quot;provisioningState&quot;: &quot;Succeeded&quot;,
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;80&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Deny&quot;,
              &quot;priority&quot;: 300,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Deny-All-Traffic&quot;,
            &quot;properties&quot;: {
              &quot;provisioningState&quot;: &quot;Succeeded&quot;,
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;80&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Deny&quot;,
              &quot;priority&quot;: 100,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          }
        ],
        &quot;subnets&quot;: [ ]
      }
    }
  ],
  &quot;outputs&quot;: { }
}
[/code]

<h2>Conclusion</h2>
You can see that you can “bring your own network” to Azure and define rules that mimic the rules of your on-premise firewall.

This adds a level of security and reliability.  Even if you use authentication for all your services on your middle tier, for instance, it is more secure to simply disallow traffic from the internet to be routed there.  Not only that, but if some attacker tries to breach in, he simply won’t get to your machine and his / her attacks won’t affect the performance of your VMs.  Hence your service will be more reliable.

Lots of variations are possible.  A popular one is to lock down the front end to an IP range to let only people from certain offices access them.

This was a quite standard network.  I chose that configuration since it is quite common but I'm sure you can see how you can start from that and customize it to fit your own requirements.