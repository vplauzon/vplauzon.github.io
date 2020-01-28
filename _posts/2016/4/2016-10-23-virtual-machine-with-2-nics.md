---
title: Virtual Machine with 2 NICs
date: 2016-10-23 16:00:25 -07:00
permalink: /2016/10/23/virtual-machine-with-2-nics/
categories:
- Solution
tags:
- Networking
- Virtual Machines
---
<img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" src="https://static.pexels.com/photos/47735/network-cables-line-network-connector-cable-47735-large.jpeg" alt="Colorful Ethernet Cable" width="271" height="181" align="left" border="0" />In Azure Resource Manager (ARM), Network Interface Cards (NICs) are a first class resource.  You can defined them without a Virtual Machine.

<strong>UPDATE:  As a reader kingly point out, NIC means <em>Network Interface Controller</em>, not <em>Network Interface Card</em> as I initially wrote.  Don't be fooled by the Azure logo ;) </strong>

Let’s take a step back and look at how the different Azure <em>Lego </em>blocks snap together to get you a VM exposed on the web.  ARM did decouple a lot of infrastructure components, so each of those are much simpler (compare to the old ASM Cloud Service), but there are many of them.
<h2>Related Resources</h2>
Here’s a diagram that can help:

<a href="/assets/posts/2016/4/virtual-machine-with-2-nics/image1.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/4/virtual-machine-with-2-nics/image_thumb1.png" alt="image" border="0" /></a>

Let’s look at the different components:
<ul>
 	<li>Availability Set:  contains a set of (or only one) VMs ; see <a href="https://vincentlauzon.com/2015/10/21/azure-basics-availability-sets/">Azure basics: Availability sets</a> for details</li>
 	<li>Storage Account:  VM hard drives are page blobs located in one or many storage accounts</li>
 	<li>NIC:  A VM has one or many NICs</li>
 	<li>Virtual Network:  a NIC is part of a subnet, where it gets its private IP address</li>
 	<li>Load Balancer:  a load balancer exposed the port of a NIC (or a pool of NICs) through a public IP address</li>
</ul>
The important point for us here:  the NIC is the one being part of a subnet, not the VM.  That means a VM can have multiple NICs in different subnets.

Also, something not shown on the diagram above, a Network Security Group (NSG) can be associated with each NIC of a VM.
<h2>One VM, many NICs</h2>
Not all VMs can have multiple NICs.  For instance, in the standard A series, the following SKUs can have only one NIC:  A0, A1, A2 &amp; A5.

You can take a look at <a href="https://azure.microsoft.com/en-us/documentation/articles/virtual-machines-windows-sizes/">https://azure.microsoft.com/en-us/documentation/articles/virtual-machines-windows-sizes/</a> to see how many NICs a given SKU support.
<h2>Why would you want to have multiple NICs?</h2>
Typically, this is a requirement for Network Appliances and for VMs passing traffic from one subnet to another.

Having multiple NICs enables more control, such as better traffic isolation.

Another requirement I’ve seen, typically with customer with high security requirements, is to isolate management traffic and transactional traffic.

For instance, let’s say you have a SQL VM with its port 1443 open to another VM (web server).  That VM needs to open its RDP port for maintenance (i.e. sys admin people to log in and do maintenance).  But if both port are opened on the same NIC, then a sys admin having RDP access could also have access to the port 1443.  For some customer, that’s unacceptable.

So the way around that is to have 2 NICs.  One NIC will be used for port 1443 (SQL) and the other for RDP (maintenance).  Then you can put each NIC in different subnet.  The SQL-NIC will be in a subnet with NSG allowing the web server to access it while the RDP-NIC will be in a subnet accessible only from the VPN Gateway, by maintenance people.
<h2>Example</h2>
You will <a href="/assets/posts/2016/4/virtual-machine-with-2-nics/2nicsarmtemplate.docx">find here an ARM template</a> (embedded in a <em>Word document</em> due to limitation of the Blog platform I'm using) deploying 2 VMs, each having 2 NICs, a Web NIC &amp; a maintenance NIC.  The Web NICs are in the <em>web subnet</em> and are publically load balanced through a public IP while the maintenance NICs are in a <em>maintenance subnet </em>and accessible only via private IPs.  The maintenance subnet let RDP get in, via its NSG.

The template will take a little while to deploy, thanks to the fact it contains a VM.  You can see most of the resources deployed quite fast though.

If you’ve done VMs with ARM before, it is pretty much the same thing, except with two NICs references in the VM.  The only thing to be watchful for is that you have to specify which NIC is primary.  You do this with the <em>primary</em> property:

```javascript


"networkProfile": {
  "networkInterfaces": [
    {
      "id": "[resourceId('Microsoft.Network/networkInterfaces', concat(variables('Web NIC Prefix'), '-', copyIndex()))]",
      "properties": {
        "primary": true
      }
    },
    {
      "id": "[resourceId('Microsoft.Network/networkInterfaces', concat(variables('Maintenance NIC Prefix'), '-', copyIndex()))]",
      "properties": {
        "primary": false
      }
    }
  ]
}

```

If you want to push the example and test it with a VPN gateway, consult <a title="https://azure.microsoft.com/en-us/documentation/articles/vpn-gateway-howto-point-to-site-rm-ps/" href="https://azure.microsoft.com/en-us/documentation/articles/vpn-gateway-howto-point-to-site-rm-ps/">https://azure.microsoft.com/en-us/documentation/articles/vpn-gateway-howto-point-to-site-rm-ps/</a> to do a point-to-site connection with your PC.
<h2>Conclusion</h2>
Somewhat a special case for VMs, a VM with 2 NICs allow you to understand a lot of design choices in ARM.  For instance, why the NICs are stand-alone resource, why they are the one to be part of a subnet and why NSG are associated to them (not the VM).

To learn more, see <a title="https://azure.microsoft.com/en-us/documentation/articles/virtual-networks-multiple-nics/" href="https://azure.microsoft.com/en-us/documentation/articles/virtual-networks-multiple-nics/">https://azure.microsoft.com/en-us/documentation/articles/virtual-networks-multiple-nics/</a>