---
title:  Load Balancing VMs in Azure Resource Manager
date:  2016-03-01 02:40:15 +00:00
permalink:  "/2016/02/29/load-balancing-vms-in-azure-resource-manager/"
categories:
- Solution
tags:
- Networking
---
Here I want to show, in details, how you would go about to expose load balanced web server VMs using Azure Resource Manager (ARM) resources.

It sounds trivial but funnily enough I didn’t find an ARM template fully doing it without bugs.

I want to explain how it works and all the moving pieces (and there are a few).  I’ll walk you through the portal in order to create the artefacts and I’ll give the ARM template at the end.

Here’s a diagram of the final state:

<a href="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image13.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image_thumb13.png" alt="image" width="616" height="825" border="0" /></a>

Basically, we’ll have 2 VMs (which of course you could extend to n VMs) in a Virtual Network with their VHD in a blob storage, those 2 VMs will have HTTP requests load balanced to them from a public IP address and will have RDP NAT to individual VMs (i.e. port 3389 will go to VM-0, port 3390 will go to VM-1).

The RDP NAT isn’t mandatory ; it could have been done differently, for instance using a point-to-site VPN to enter the Virtual Network.  But since we covered the Load Balancer, I thought I might show the NAT rules while we’re there.

As you can see, there are quite a few puzzle pieces (NICs aren’t even represented!).  If you compare that with Cloud Service, it might seem complicated.  The thing is Cloud Service aggregated a bunch of features and at it end it was hard or impossible to cover other scenarios.  The new model is more modular with more (simpler) components.

Let’s start!
<h2>Resource Group</h2>
We’re in ARM and the first thing we’ll do is to create a resource group.  The resource group will contain all the Azure artefacts.

One of the nice things of resource group is that when you do some exploration or POCs, once you’re done you can simply delete the resource group and all the artefacts underneath will disappear.

Give the resource group the name you want and create it in the region you prefer.  It is absolutely possible to create a resource group in region X and artefacts underneath in region Y, but I find that confusing unless you’re addressing a DR scenario within one resource group.
<h2>Public IP Address</h2>
The first piece of the puzzle, the Public IP address.  Type “Public IP Address” in the marketplace and choose the one published by Microsoft.

<a href="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image15.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image_thumb15.png" alt="image" width="340" height="480" border="0" /></a>

For the name, call it <em>Public-IP</em>  but it really doesn’t matter:  this is the resource name and nobody else than you will see that.

Dynamic or Static?  In this post, we’ll go with dynamic because it’s the cheapest option and I’m stingy, am I?

Basically, a static IP address gives you a public IP address that won’t change.  It can be useful in some scenarios but is unnecessary in most and you pay for it.

A dynamic IP is an IP address that will change on Azure whims.  But you do not pay for it.  With dynamic IP addresses, you do not bind on the IP address, you bind on the <em>DNS name label</em>.  Azure makes sure the fully qualified domain name (<a href="https://en.wikipedia.org/wiki/Fully_qualified_domain_name" target="_blank">FQDN</a>) is in sync with the IP address whenever it changes.

Idle timeout is usually ok at the default value.  This configuration allows you to decide when to kill an idle TCP connection.

DNS label must be unique.  I often use my initials, VPL, but it isn’t the most professional approach.  You then select the resource group you just created and make sure it’s in the same region.
<h3>DNS Configuration</h3>
We have a public IP.  This is good but it’s on an Azure domain name.  It will be:

<em>&lt;The lable you chose&gt;.&lt;Name of the region&gt;.cloudapp.azure.com</em>

It’s ok for demo, might even be alright for dev &amp; QA.  For production, it’s a bit like using your hotmail account for doing business:  it doesn’t blink “we are serious” very brightly.

So what you’ll wanna do is to map your real domain name, let’s say <a href="http://www.fantasticweb.com">www.fantasticweb.com</a>, to the cloudapp one.

This is done by entering a Canonical Name (<a href="https://en.wikipedia.org/wiki/CNAME_record" target="_blank">CNAME</a>) record either in your registrar or the upcoming <a href="https://azure.microsoft.com/en-us/services/dns/" target="_blank">Azure DNS Service</a>.  What the hell is that?  A CNAME gives DNS levels of indirection to resolve DNS.  For instance we could have:
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th>DNS</th>
<th>Source</th>
<th>Target</th>
<th>Record Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>Your Registrar</td>
<td><a href="http://www.fantastic.com">www.fantastic.com</a></td>
<td>&lt;something&gt;.cloudapp.azure.com</td>
<td>CNAME</td>
</tr>
<tr>
<td>Azure</td>
<td>&lt;something&gt;.cloudapp.azure.com</td>
<td>143.32.45.12</td>
<td>A</td>
</tr>
</tbody>
</table>
So when somebody browses for <a href="http://www.fantastic.com">www.fantastic.com</a>, unbeknown to them, there is a bit of a dance happening to find the actual target IP address.

You can learn more about it <a href="https://azure.microsoft.com/en-us/documentation/articles/cloud-services-custom-domain-name/" target="_blank">here</a>.
<h2>Virtual Network</h2>
Let’s create a Virtual Network to put our VMs in.

This is one of the major differences with ARM (vs Cloud Services):  VMs always live in a Virtual Network.  You can leave the door open if you like the air the get in, but you need a vnet.

So in the Azure Marketplace, type “Virtual Network”, take the one published by Microsoft.  Make sure you choose the Resource Manager before hitting <em>Create</em>

<a href="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image16.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image_thumb16.png" alt="image" width="669" height="217" border="0" /></a>

You can name the vnet…  “vnet”.  Make sure you put it in the right resource group and then hit create.

This creates a vnet with a default subnet.  In this post, I won’t secure the network.  If you want to do that, I suggest you read <a href="https://vincentlauzon.com/2015/12/21/using-network-security-groups-nsg-to-secure-network-access-to-an-environment/">this post</a>.
<h2>Storage</h2>
We’ll need storage to store the virtual hard drives of the VMs.

Let’s create a storage account.  Again, make sure you select “Resource Manager” as deployment model before hitting create.  Make sure you put it in the same resource group &amp; region.
<h2>Availability Set</h2>
Next, we’ll create an availability set.  An availability set is a declarative construct that says to Azure:  please distribute the VMs that are in it across different failure &amp; update domains.  For more details on availability sets, please read <a href="https://vincentlauzon.com/2015/10/21/azure-basics-availability-sets/">this post</a>.

In the Azure Marketplace, search for “Availability Set”, select the one from Microsoft.

You must give it a name.  I suggest “AvailSet”.  Make sure you put it in the right resource group and Azure region.

You could configure the number of update domains &amp; failure domains here.  This is why an availability set is “a thing” in ARM while it used to be simply a name in ASM:  in order to attach more configuration to it.
<h2>Virtual Machines</h2>
Here we’ll create 2 virtual machines.  I’m going to create Windows Server 2012 VMs but you could go ahead and create any Linux VMs.  The reminder of the post would be identical.

In Azure Marketplace, search for “windows 2012” and select “Windows Server 2012 R2 Datacenter” published by Microsoft.

<a href="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image19.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image_thumb19.png" alt="image" width="1586" height="151" border="0" /></a>

VMs require a fair bit of configuration, so let’s go with it.

In the (1) Basics configuration, give your vm the name “VM-0”.  Give a login name / password ; this will be the local admin account of the VM.  Make sure it is in the right resource group and Azure region.

For the size (2), since it’s a demo, go with something small, such as a A2.

For the configuration (3), this is where the meat is.  Select the storage account we’ve created.  Select the virtual network we created.  For public IP address, select <em>None</em>.  For Network Security Group, select <em>None</em>.  At the bottom, for Availability Set, select “AvailSet” that we’ve just created.

You can now create the VM.  This is quite slow, so go ahead and create the second one.  Configurations will be identical but for its name, “VM-1”.
<h2>Load Balancer</h2>
Ok, now let’s stick everything together!

In the Azure Marketplace, type “Load Balancer” and select the one published by Microsoft.

Let’s call it “LB”, keep the scheme to “public”, choose the public IP as the one we’ve created, i.e. “Public-IP”.  As usual, let’s put it in the same region &amp; resource group.

<a href="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image22.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image_thumb22.png" alt="image" width="216" height="240" border="0" /></a>

Let’s create it.

Then let’s configure the backend pools.

<a href="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image23.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image_thumb23.png" alt="image" width="240" height="134" border="0" /></a>

We’ll add one, then name it “Web” and “Add a virtual Machine”.

For the availability set, we choose the one we’ve created, i.e. “AvailSet” and for the virtual machines, we select both VM-0 &amp; VM-1.

This defines the targets for the load balancer.

Now, let’s define a probe.

<a href="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image24.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image_thumb24.png" alt="image" width="240" height="215" border="0" /></a>

Let’s add one, call it “TCP-Probe”, give it the protocol TCP and leave the port to 80, interval to 5 seconds and unhealthy threshold to 2.

<a href="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image25.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image_thumb25.png" alt="image" width="210" height="240" border="0" /></a>

That probe is basically going to define when a VM is healthy or not.  When the VM can’t let the probe connect, it’s going to be removed from the load balancer roaster.
<h3>Load Balancing Rules</h3>
Now for the load balancing rules.

<a href="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image26.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image_thumb26.png" alt="image" width="240" height="219" border="0" /></a>

Let’s create one, call it “Http”, with protocol TCP, port 80, backend port 80, the back-end pool “Web” (that we just created), Probe “TCP-Probe” (that we also just created), Session Persistence “None”, Idle timeout 4 mins, Floating IP “Disabled”.

Basically, we say that TCP requests coming on the public IP will be forwarded to the availability set on their port 80.
<h3>NAT Rules</h3>
Let’s setup a NAT Rule to forward RDP requests as follow.

<a href="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image27.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image_thumb27.png" alt="image" width="565" height="514" border="0" /></a>

So, we’ll create 2 NAT rules.

<a href="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image28.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image_thumb28.png" alt="image" width="240" height="224" border="0" /></a>

For the first one, let’s call it “RDP-to-VM-0”, let’s select the RDP Service, protocol TCP, Port 3389, target “VM-0”, port mapping “default”.

For the second one, let’s call it “RDP-to-VM-1”, let’s select the RDP Service, protocol TCP, Port 3390 (override it), target “VM-1”, port mapping “custom” &amp; target port 3389.
<h2>Testing</h2>
That’s all the configuration we need.

From here, you can connect to your VMs.

<a href="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image29.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/3/load-balancing-vms-in-azure-resource-manager/image_thumb29.png" alt="image" width="240" height="74" border="0" /></a>

What we’ll want to do for testing is to configure a simple web site on each VM giving a different page each.  Let’s say that VM-0 prints out “VM-0 Site” and VM-1 prints out “VM-1 Site”.

To do that is a bit outside the scope of this post.  Basically, you need to add the “web server” role to your VMs then localize where IIS root folder is (typically in C:\inetpub\wwwroot) and drop a file “index.html” there with the desired output.

Now if you hit the FQDN of your public IP with a browser, you should see one of the two outputs.  If you hit F5, you’ll see…  the same?  Why is that?

That’s because your browser keeps the connection alive and we have 4 minutes before the load balancer times it out.

If you want to have a more spectacular test, go in Visual Studio and create a Console app with the following code:

[code language="csharp"]
using System;
using System.IO;
using System.Net;

namespace TestLbConsole
{
    class Program
    {
        static void Main(string[] args)
        {
            for (int i = 0; i != 10; ++i)
            {
                var request =
                    WebRequest.Create(&quot;http://vpl-ip.southcentralus.cloudapp.azure.com/&quot;) as HttpWebRequest;

                request.KeepAlive = false;

                using (var response = request.GetResponse())
                using (var stream = response.GetResponseStream())
                using (var reader = new StreamReader(stream))
                {
                    var payload = reader.ReadToEnd();

                    Console.WriteLine(payload);
                }
            }
        }
    }
}
[/code]

Since we disable the <em>KeepAlive</em>, we now hit a different VM each time!
<h2>Conclusion</h2>
So, that was a bit complicated but hopefully, you followed all along.

There are lots of bit and pieces, but they each are simple.

Here is the ARM template allowing you to reproduce what we did in this article.

Please note <strong>I wasn’t able to incorporate the NAT rules into the ARM template</strong>.  This is due to a current limitation of the schema:  we can’t have loops within NAT rules.  So you’ll need to enter those rules manually in order to RDP into the VMs.

[code language="javascript"]

{
  &quot;$schema&quot;: &quot;http://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#&quot;,
  &quot;contentVersion&quot;: &quot;1.0.0.0&quot;,
  &quot;parameters&quot;: {
    &quot;vm-admin-name&quot;: {
      &quot;type&quot;: &quot;string&quot;,
      &quot;defaultValue&quot;: &quot;Macgyver&quot;
    },
    &quot;vm-admin-password&quot;: {
      &quot;type&quot;: &quot;securestring&quot;
    },
    &quot;vm-prefix&quot;: {
      &quot;type&quot;: &quot;string&quot;,
      &quot;defaultValue&quot;: &quot;VM-&quot;
    },
    &quot;storage-account-name&quot;: {
      &quot;type&quot;: &quot;string&quot;
    },
    &quot;number-of-instance&quot;: {
      &quot;type&quot;: &quot;int&quot;,
      &quot;defaultValue&quot;: 2
    },
    &quot;vm-size&quot;: {
      &quot;type&quot;: &quot;string&quot;,
      &quot;minLength&quot;: 1,
      &quot;defaultValue&quot;: &quot;Standard_A1&quot;,
      &quot;allowedValues&quot;: [
        &quot;Basic_A0&quot;,
        &quot;Basic_A1&quot;,
        &quot;Basic_A2&quot;,
        &quot;Basic_A3&quot;,
        &quot;Basic_A4&quot;,
        &quot;Standard_A0&quot;,
        &quot;Standard_A1&quot;,
        &quot;Standard_A2&quot;,
        &quot;Standard_A3&quot;,
        &quot;Standard_A4&quot;,
        &quot;Standard_A5&quot;,
        &quot;Standard_A6&quot;,
        &quot;Standard_A7&quot;,
        &quot;Standard_D1&quot;,
        &quot;Standard_D2&quot;,
        &quot;Standard_D3&quot;,
        &quot;Standard_D4&quot;,
        &quot;Standard_D11&quot;,
        &quot;Standard_D12&quot;,
        &quot;Standard_D13&quot;,
        &quot;Standard_D14&quot;
      ]
    }
  },
  &quot;variables&quot;: {
    &quot;AvailSet-name&quot;: &quot;AvailSet&quot;,
    &quot;LoadBalancer-name&quot;: &quot;LB&quot;,
    &quot;backend-address-pool-name&quot;: &quot;Web&quot;,
    &quot;PublicIP-name&quot;: &quot;Public-IP&quot;,
    &quot;VNet-name&quot;: &quot;VNet&quot;,
    &quot;vm-subnet-name&quot;: &quot;vm-subnet&quot;,
    &quot;NIC-prefix&quot;: &quot;NIC-&quot;,
    &quot;VM-prefix&quot;: &quot;VM-&quot;
  },
  &quot;resources&quot;: [
    {
      &quot;type&quot;: &quot;Microsoft.Compute/availabilitySets&quot;,
      &quot;name&quot;: &quot;[variables('AvailSet-name')]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Availability Set&quot;
      },
      &quot;properties&quot;: {
        &quot;platformUpdateDomainCount&quot;: 5,
        &quot;platformFaultDomainCount&quot;: 3
      }
    },
    {
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;type&quot;: &quot;Microsoft.Network/networkInterfaces&quot;,
      &quot;name&quot;: &quot;[concat(variables('NIC-prefix'), copyindex())]&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Network Interface&quot;
      },
      &quot;copy&quot;: {
        &quot;name&quot;: &quot;nic-loop&quot;,
        &quot;count&quot;: &quot;[parameters('number-of-instance')]&quot;
      },
      &quot;dependsOn&quot;: [
        &quot;[concat('Microsoft.Network/virtualNetworks/', variables('VNet-Name'))]&quot;,
        &quot;[concat('Microsoft.Network/loadBalancers/', variables('LoadBalancer-name'))]&quot;
      ],
      &quot;properties&quot;: {
        &quot;ipConfigurations&quot;: [
          {
            &quot;name&quot;: &quot;ipconfig1&quot;,
            &quot;properties&quot;: {
              &quot;privateIPAllocationMethod&quot;: &quot;Dynamic&quot;,
              &quot;subnet&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/virtualNetworks', variables('VNet-Name')), '/subnets/', variables('vm-subnet-name'))]&quot;
              },
              &quot;loadBalancerBackendAddressPools&quot;: [
                {
                  &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('LoadBalancer-name')), '/backendAddressPools/', variables('backend-address-pool-name'))]&quot;
                }
              ]
            }
          }
        ]
      }
    },
    {
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;type&quot;: &quot;Microsoft.Compute/virtualMachines&quot;,
      &quot;name&quot;: &quot;[concat(variables('VM-prefix'), copyindex())]&quot;,
      &quot;copy&quot;: {
        &quot;name&quot;: &quot;vm-loop&quot;,
        &quot;count&quot;: &quot;[parameters('number-of-instance')]&quot;
      },
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Virtual Machines&quot;
      },
      &quot;dependsOn&quot;: [
        &quot;[concat('Microsoft.Storage/storageAccounts/', parameters('storage-account-name'))]&quot;,
        &quot;nic-loop&quot;,
        &quot;[concat('Microsoft.Compute/availabilitySets/', variables('AvailSet-name'))]&quot;
      ],
      &quot;properties&quot;: {
        &quot;availabilitySet&quot;: {
          &quot;id&quot;: &quot;[resourceId('Microsoft.Compute/availabilitySets', variables('AvailSet-name'))]&quot;
        },
        &quot;hardwareProfile&quot;: {
          &quot;vmSize&quot;: &quot;[parameters('vm-size')]&quot;
        },
        &quot;osProfile&quot;: {
          &quot;computerName&quot;: &quot;[concat(variables('VM-prefix'), copyIndex())]&quot;,
          &quot;adminUsername&quot;: &quot;[parameters('vm-admin-name')]&quot;,
          &quot;adminPassword&quot;: &quot;[parameters('vm-admin-password')]&quot;
        },
        &quot;storageProfile&quot;: {
          &quot;imageReference&quot;: {
            &quot;publisher&quot;: &quot;MicrosoftWindowsServer&quot;,
            &quot;offer&quot;: &quot;WindowsServer&quot;,
            &quot;sku&quot;: &quot;2012-Datacenter&quot;,
            &quot;version&quot;: &quot;latest&quot;
          },
          &quot;osDisk&quot;: {
            &quot;name&quot;: &quot;osdisk&quot;,
            &quot;vhd&quot;: {
              &quot;uri&quot;: &quot;[concat('http://', parameters('storage-account-name'), '.blob.core.windows.net/vhds/', 'osdisk', copyindex(), '.vhd')]&quot;
            },
            &quot;caching&quot;: &quot;ReadWrite&quot;,
            &quot;createOption&quot;: &quot;FromImage&quot;
          }
        },
        &quot;networkProfile&quot;: {
          &quot;networkInterfaces&quot;: [
            {
              &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkInterfaces', concat(variables('NIC-prefix'), copyindex()))]&quot;
            }
          ]
        }
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/loadBalancers&quot;,
      &quot;name&quot;: &quot;[variables('LoadBalancer-name')]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Load Balancer&quot;
      },
      &quot;properties&quot;: {
        &quot;frontendIPConfigurations&quot;: [
          {
            &quot;name&quot;: &quot;LoadBalancerFrontEnd&quot;,
            &quot;properties&quot;: {
              &quot;privateIPAllocationMethod&quot;: &quot;Dynamic&quot;,
              &quot;publicIPAddress&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/publicIPAddresses', variables('PublicIP-name'))]&quot;
              }
            }
          }
        ],
        &quot;backendAddressPools&quot;: [
          {
            &quot;name&quot;: &quot;[variables('backend-address-pool-name')]&quot;
          }
        ],
        &quot;loadBalancingRules&quot;: [
          {
            &quot;name&quot;: &quot;Http&quot;,
            &quot;properties&quot;: {
              &quot;frontendIPConfiguration&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('LoadBalancer-name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]&quot;
              },
              &quot;frontendPort&quot;: 80,
              &quot;backendPort&quot;: 80,
              &quot;enableFloatingIP&quot;: false,
              &quot;idleTimeoutInMinutes&quot;: 4,
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;loadDistribution&quot;: &quot;Default&quot;,
              &quot;backendAddressPool&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('LoadBalancer-name')), '/backendAddressPools/', variables('backend-address-pool-name'))]&quot;
              },
              &quot;probe&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('LoadBalancer-name')), '/probes/TCP-Probe')]&quot;
              }
            }
          }
        ],
        &quot;probes&quot;: [
          {
            &quot;name&quot;: &quot;TCP-Probe&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;port&quot;: 80,
              &quot;intervalInSeconds&quot;: 5,
              &quot;numberOfProbes&quot;: 2
            }
          }
        ],
        &quot;inboundNatRules&quot;: [ ],
        &quot;outboundNatRules&quot;: [ ],
        &quot;inboundNatPools&quot;: [ ]
      },
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/publicIPAddresses', variables('PublicIP-name'))]&quot;
      ]
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/publicIPAddresses&quot;,
      &quot;name&quot;: &quot;[variables('PublicIP-name')]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Public IP&quot;
      },
      &quot;properties&quot;: {
        &quot;publicIPAllocationMethod&quot;: &quot;Dynamic&quot;,
        &quot;idleTimeoutInMinutes&quot;: 4,
        &quot;dnsSettings&quot;: {
          &quot;domainNameLabel&quot;: &quot;vpl-ip&quot;
        }
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/virtualNetworks&quot;,
      &quot;name&quot;: &quot;[variables('VNet-name')]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Virtual Network&quot;
      },
      &quot;properties&quot;: {
        &quot;addressSpace&quot;: {
          &quot;addressPrefixes&quot;: [
            &quot;10.1.0.0/16&quot;
          ]
        },
        &quot;subnets&quot;: [
          {
            &quot;name&quot;: &quot;[variables('vm-subnet-name')]&quot;,
            &quot;properties&quot;: {
              &quot;addressPrefix&quot;: &quot;10.1.0.0/24&quot;
            }
          }
        ]
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Storage/storageAccounts&quot;,
      &quot;name&quot;: &quot;[parameters('storage-account-name')]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Storage Account&quot;
      },
      &quot;properties&quot;: {
        &quot;accountType&quot;: &quot;Standard_LRS&quot;
      }
    }
  ]
}

[/code]

Here are the template's parameters:
<table border="3" width="769">
<thead>
<tr style="background:green;color:white;">
<th>Name</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>vm-admin-name</td>
<td>string</td>
<td>Name of the local admin user on the vms.</td>
</tr>
<tr>
<td>vm-admin-password</td>
<td>secured string</td>
<td>Password of the local admin user.</td>
</tr>
<tr>
<td>storage-account-name</td>
<td>string</td>
<td>Name of the storage account where the vhds are stored.

This needs to be unique within all storage accounts (not only yours).</td>
</tr>
<tr>
<td>number-of-instance</td>
<td>int</td>
<td>The number of vms to scale out.</td>
</tr>
<tr>
<td>vm-size</td>
<td>string</td>
<td>The size of vm (e.g. A2).</td>
</tr>
</tbody>
</table>