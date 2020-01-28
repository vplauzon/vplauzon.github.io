---
title: Troubleshooting NSGs using Diagnostic Logs
date: 2017-01-09 04:32:42 -08:00
permalink: /2017/01/09/troubleshooting-nsgs-using-diagnostic-logs/
categories:
- Solution
tags:
- Networking
- Virtual Machines
---
<img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" src="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/marketing-man-person-communication2.jpg" width="379" height="253" align="right" border="0" />I’ve wrote about how to use Network Security Group (NSG) <a href="https://vincentlauzon.com/2015/12/21/using-network-security-groups-nsg-to-secure-network-access-to-an-environment/">before</a>.

Chances are, once you get a complicated enough set of rules in a NSG, you’ll find yourself with NSGs that do not do what you think they should do.

Troubleshooting NSGs isn’t trivial.

I’ll try to give some guidance here but to this date (January 2017), there is no tool where you can just say “please follow packet X and tell me against which wall it bumps”.  It’s more indirect than that.

&nbsp;
<h2>Connectivity</h2>
First thing, make sure you can connect to your VNET.

If you are connecting to a VM via a public IP, make sure you have access to that IP (i.e. you’re not sitting behind an on premise firewall blocking the outgoing port you are trying to use), that the IP is connected to the VM either directly or via a Load Balancer.

If you are connecting to a VM via a private IP through a VPN Gateway of some sort, make sure you can connect and that your packets are routed to the gateway and from there they get routed to the proper subnet.

An easy way to make sure of that is to remove all NSGs and replace them by a “let everything go in”.  Of course, that’s also opening your workloads to hackers, so I recommend you do that with a test VM that you destroy afterwards.
<h2>Diagnose</h2>
Then I would recommend to go through the official Azure guidelines to <a href="https://docs.microsoft.com/en-us/azure/virtual-network/virtual-network-nsg-troubleshoot-portal" target="_blank">troubleshoot NSGs</a>.  This walks you through the different diagnosis tools.
<h2>Diagnostic Logs</h2>
If you reached this section and haven’t achieve greatness yet, well…  You need something else.

What we’re going to do here is use NSG Diagnostic Logs to understand a bit more what is going on.

By no means is this magic and especially in an environment already in use where a lot of traffic is occurring, it might be difficult to make sense of what the logs are going to give us.

Nevertheless, the logs give us a picture of what really is happening.  They are aggregated though, so we won’t see your PC IP address for instance.  The aggregation is probably what limit the logs effectiveness the most.
<h2>Sample configuration</h2>
I provide here a sample configuration I’m going to use to walk through the troubleshooting process.

```JavaScript
{
  "$schema": "https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "VM Admin User Name": {
      "defaultValue": "myadmin",
      "type": "string"
    },
    "VM Admin Password": {
      "defaultValue": null,
      "type": "securestring"
    },
    "Disk Storage Account Name": {
      "defaultValue": "<your prefix>vmpremium",
      "type": "string"
    },
    "Log Storage Account Name": {
      "defaultValue": "<your prefix>logstandard",
      "type": "string"
    },
    "VM Size": {
      "defaultValue": "Standard_DS2",
      "type": "string",
      "allowedValues": [
        "Standard_DS1",
        "Standard_DS2",
        "Standard_DS3"
      ],
      "metadata": {
        "description": "SKU of the VM."
      }
    },
    "Public Domain Label": {
      "type": "string"
    }
  },
  "variables": {
    "Vhds Container Name": "vhds",
    "VNet Name": "MyVNet",
    "Ip Range": "10.0.1.0/24",
    "Public IP Name": "MyPublicIP",
    "Public LB Name": "PublicLB",
    "Address Pool Name": "addressPool",
    "Subnet NSG Name": "subnetNSG",
    "VM NSG Name": "vmNSG",
    "RDP NAT Rule Name": "RDP",
    "NIC Name": "MyNic",
    "VM Name": "MyVM"
  },
  "resources": [
    {
      "type": "Microsoft.Network/publicIPAddresses",
      "name": "[variables('Public IP Name')]",
      "apiVersion": "2015-06-15",
      "location": "[resourceGroup().location]",
      "tags": {
        "displayName": "Public IP"
      },
      "properties": {
        "publicIPAllocationMethod": "Dynamic",
        "idleTimeoutInMinutes": 4,
        "dnsSettings": {
          "domainNameLabel": "[parameters('Public Domain Label')]"
        }
      }
    },
    {
      "type": "Microsoft.Network/loadBalancers",
      "name": "[variables('Public LB Name')]",
      "apiVersion": "2015-06-15",
      "location": "[resourceGroup().location]",
      "tags": {
        "displayName": "Public Load Balancer"
      },
      "properties": {
        "frontendIPConfigurations": [
          {
            "name": "LoadBalancerFrontEnd",
            "comments": "Front end of LB:  the IP address",
            "properties": {
              "publicIPAddress": {
                "id": "[resourceId('Microsoft.Network/publicIPAddresses/', variables('Public IP Name'))]"
              }
            }
          }
        ],
        "backendAddressPools": [
          {
            "name": "[variables('Address Pool Name')]"
          }
        ],
        "loadBalancingRules": [
          {
            "name": "Http",
            "properties": {
              "frontendIPConfiguration": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]"
              },
              "frontendPort": 80,
              "backendPort": 80,
              "enableFloatingIP": false,
              "idleTimeoutInMinutes": 4,
              "protocol": "Tcp",
              "loadDistribution": "Default",
              "backendAddressPool": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Address Pool Name'))]"
              },
              "probe": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/probes/TCP-Probe')]"
              }
            }
          }
        ],
        "probes": [
          {
            "name": "TCP-Probe",
            "properties": {
              "protocol": "Tcp",
              "port": 80,
              "intervalInSeconds": 5,
              "numberOfProbes": 2
            }
          }
        ],
        "inboundNatRules": [
          {
            "name": "[variables('RDP NAT Rule Name')]",
            "properties": {
              "frontendIPConfiguration": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]"
              },
              "frontendPort": 3389,
              "backendPort": 3389,
              "protocol": "Tcp"
            }
          }
        ],
        "outboundNatRules": [],
        "inboundNatPools": []
      },
      "dependsOn": [
        "[resourceId('Microsoft.Network/publicIPAddresses', variables('Public IP Name'))]"
      ]
    },
    {
      "type": "Microsoft.Network/virtualNetworks",
      "name": "[variables('VNet Name')]",
      "apiVersion": "2016-03-30",
      "location": "[resourceGroup().location]",
      "properties": {
        "addressSpace": {
          "addressPrefixes": [
            "10.0.0.0/16"
          ]
        },
        "subnets": [
          {
            "name": "default",
            "properties": {
              "addressPrefix": "[variables('Ip Range')]",
              "networkSecurityGroup": {
                "id": "[resourceId('Microsoft.Network/networkSecurityGroups', variables('Subnet NSG Name'))]"
              }
            }
          }
        ]
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Network/networkSecurityGroups', variables('Subnet NSG Name'))]"
      ]
    },
    {
      "apiVersion": "2015-06-15",
      "name": "[variables('Subnet NSG Name')]",
      "type": "Microsoft.Network/networkSecurityGroups",
      "location": "[resourceGroup().location]",
      "tags": {},
      "properties": {
        "securityRules": [
          {
            "name": "Allow-HTTP-From-Internet",
            "properties": {
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "80",
              "sourceAddressPrefix": "Internet",
              "destinationAddressPrefix": "*",
              "access": "Allow",
              "priority": 100,
              "direction": "Inbound"
            }
          },
          {
            "name": "Allow-RDP-From-Everywhere",
            "properties": {
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "3389",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*",
              "access": "Allow",
              "priority": 150,
              "direction": "Inbound"
            }
          },
          {
            "name": "Allow-Health-Monitoring",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "AzureLoadBalancer",
              "destinationAddressPrefix": "*",
              "access": "Allow",
              "priority": 200,
              "direction": "Inbound"
            }
          },
          {
            "name": "Disallow-everything-else-Inbound",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*",
              "access": "Deny",
              "priority": 300,
              "direction": "Inbound"
            }
          },
          {
            "name": "Allow-to-VNet",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "VirtualNetwork",
              "access": "Allow",
              "priority": 100,
              "direction": "Outbound"
            }
          },
          {
            "name": "Disallow-everything-else-Outbound",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*",
              "access": "Deny",
              "priority": 200,
              "direction": "Outbound"
            }
          }
        ],
        "subnets": []
      }
    },
    {
      "apiVersion": "2015-06-15",
      "name": "[variables('VM NSG Name')]",
      "type": "Microsoft.Network/networkSecurityGroups",
      "location": "[resourceGroup().location]",
      "tags": {},
      "properties": {
        "securityRules": [
          {
            "name": "Allow-HTTP-From-Internet",
            "properties": {
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "80",
              "sourceAddressPrefix": "Internet",
              "destinationAddressPrefix": "*",
              "access": "Allow",
              "priority": 100,
              "direction": "Inbound"
            }
          },
          {
            "name": "Allow-Health-Monitoring",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "AzureLoadBalancer",
              "destinationAddressPrefix": "*",
              "access": "Allow",
              "priority": 200,
              "direction": "Inbound"
            }
          },
          {
            "name": "Disallow-everything-else-Inbound",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*",
              "access": "Deny",
              "priority": 300,
              "direction": "Inbound"
            }
          },
          {
            "name": "Allow-to-VNet",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "VirtualNetwork",
              "access": "Allow",
              "priority": 100,
              "direction": "Outbound"
            }
          },
          {
            "name": "Disallow-everything-else-Outbound",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*",
              "access": "Deny",
              "priority": 200,
              "direction": "Outbound"
            }
          }
        ],
        "subnets": []
      }
    },
    {
      "type": "Microsoft.Network/networkInterfaces",
      "name": "[variables('NIC Name')]",
      "apiVersion": "2016-03-30",
      "location": "[resourceGroup().location]",
      "properties": {
        "ipConfigurations": [
          {
            "name": "ipconfig",
            "properties": {
              "privateIPAllocationMethod": "Dynamic",
              "subnet": {
                "id": "[concat(resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name')), '/subnets/default')]"
              },
              "loadBalancerBackendAddressPools": [
                {
                  "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Address Pool Name'))]"
                }
              ],
              "loadBalancerInboundNatRules": [
                {
                  "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/inboundNatRules/', variables('RDP NAT Rule Name'))]"
                }
              ]
            }
          }
        ],
        "dnsSettings": {
          "dnsServers": []
        },
        "enableIPForwarding": false,
        "networkSecurityGroup": {
          "id": "[resourceId('Microsoft.Network/networkSecurityGroups', variables('VM NSG Name'))]"
        }
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name'))]",
        "[resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name'))]"
      ]
    },
    {
      "type": "Microsoft.Compute/virtualMachines",
      "name": "[variables('VM Name')]",
      "apiVersion": "2015-06-15",
      "location": "[resourceGroup().location]",
      "properties": {
        "hardwareProfile": {
          "vmSize": "[parameters('VM Size')]"
        },
        "storageProfile": {
          "imageReference": {
            "publisher": "MicrosoftWindowsServer",
            "offer": "WindowsServer",
            "sku": "2012-R2-Datacenter",
            "version": "latest"
          },
          "osDisk": {
            "name": "[variables('VM Name')]",
            "createOption": "FromImage",
            "vhd": {
              "uri": "[concat('https', '://', parameters('Disk Storage Account Name'), '.blob.core.windows.net', concat('/', variables('Vhds Container Name'),'/', variables('VM Name'), '-os-disk.vhd'))]"
            },
            "caching": "ReadWrite"
          },
          "dataDisks": []
        },
        "osProfile": {
          "computerName": "[variables('VM Name')]",
          "adminUsername": "[parameters('VM Admin User Name')]",
          "windowsConfiguration": {
            "provisionVMAgent": true,
            "enableAutomaticUpdates": true
          },
          "secrets": [],
          "adminPassword": "[parameters('VM Admin Password')]"
        },
        "networkProfile": {
          "networkInterfaces": [
            {
              "id": "[resourceId('Microsoft.Network/networkInterfaces', concat(variables('NIC Name')))]"
            }
          ]
        }
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Storage/storageAccounts', parameters('Disk Storage Account Name'))]",
        "[resourceId('Microsoft.Network/networkInterfaces', variables('NIC Name'))]"
      ]
    },
    {
      "type": "Microsoft.Storage/storageAccounts",
      "name": "[parameters('Disk Storage Account Name')]",
      "sku": {
        "name": "Premium_LRS",
        "tier": "Premium"
      },
      "kind": "Storage",
      "apiVersion": "2016-01-01",
      "location": "[resourceGroup().location]",
      "properties": {},
      "resources": [],
      "dependsOn": []
    },
    {
      "type": "Microsoft.Storage/storageAccounts",
      "name": "[parameters('Log Storage Account Name')]",
      "sku": {
        "name": "Standard_LRS",
        "tier": "standard"
      },
      "kind": "Storage",
      "apiVersion": "2016-01-01",
      "location": "[resourceGroup().location]",
      "properties": {},
      "resources": [],
      "dependsOn": []
    }
  ]
}
```

The sample has one VM sitting in a subnet protected by a NSG.  The VM’s NIC is also protected by NSG, to make our life complicated (as we do too often).  The VM is exposed on a Load Balanced Public IP and RDP is enabled via NAT rules on the Load Balancer.

The VM is running on a Premium Storage account but the sample also creates a standard storage account to store the logs.
<h2>The Problem</h2>
The problem we are going to try to find using Diagnostic Logs is that the subnet’s NSG let RDP in via "Allow-RDP-From-Everywhere" rule while the NIC’s doesn’t and that type of traffic will get blocked, as everything else, by the "Disallow-everything-else-Inbound" rule.

In practice, you’ll likely have something more complicated going on, maybe some IP filtering, etc.  .   But the principles remain.
<h2>Enabling Diagnostic Logs</h2>
I couldn’t enable the Diagnostic Logs via the ARM template as it isn’t possible to do so yet.  We can do that <a href="https://docs.microsoft.com/en-us/azure/virtual-network/virtual-network-nsg-manage-log" target="_blank">via the Portal or PowerShell</a>.

I’ll illustrate the Portal here, since it’s for troubleshooting, chances are you won’t automate it.

I’ve covered <a href="https://vincentlauzon.com/2016/11/27/primer-on-azure-monitor/">Azure Monitor in a previous article</a>.  We’ve seen that different providers expose <a href="https://docs.microsoft.com/en-us/azure/monitoring-and-diagnostics/monitoring-overview-of-diagnostic-logs#supported-services-and-schema-for-diagnostic-logs" target="_blank">different schemas</a>.

NSGs expose <a href="https://docs.microsoft.com/en-us/azure/monitoring-and-diagnostics/monitoring-overview-of-diagnostic-logs#supported-services-and-schema-for-diagnostic-logs" target="_blank">two categories of Diagnostic Logs</a>:  <em>Event</em> and <em>Rule Counter</em>.  We’re going to use <em>Rule Counter</em> only.

Rule Counter will give us a count of how many times a given rule was triggered for a given target (MAC address / IP).  Again, if we have lots of traffic flying around, that won’t be super useful.  This is why I recommend to isolate the network (or recreate an isolated one) in order to troubleshoot.

We’ll start by the subnet NSG.

<a href="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb.png" alt="image" width="640" height="417" border="0" /></a>

Scrolling all the way down on the NSG’s pane left menu, we select <em>Diagnostics Logs</em>.

<a href="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image1.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb1.png" alt="image" width="338" height="480" border="0" /></a>

The pane should look as follow since no diagnostics are enabled.  Let’s click on <em>Turn on diagnostics</em>.

<a href="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image2.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb2.png" alt="image" width="640" height="186" border="0" /></a>

We then turn it on.

<a href="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image3.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb3.png" alt="image" width="640" height="273" border="0" /></a>

For simplicity here, we’re going to use the <em>Archive to a storage account</em>.

<a href="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image4.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb4.png" alt="image" width="525" height="480" border="0" /></a>

We will configure the storage account to send the logs to.

<a href="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image5.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb5.png" alt="image" width="640" height="192" border="0" /></a>

For that, we’re selecting the standard account created by the template or whichever storage account you fancy.  Log Diagnostics will go and create a blob container for each category in the selected account.  The names a predefined (you can’t choose).

We select the <em>NetworkSecurityGroupRuleCounter</em> category.

<a href="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image6.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb6.png" alt="image" width="640" height="146" border="0" /></a>

And finally we hit the save button on the pane.

We’ll do the same thing with the VM NSG.

<a href="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image7.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb7.png" alt="image" width="640" height="391" border="0" /></a>
<h2>Creating logs</h2>
No we are going to try to get through our VM.  We are going to describe how to that with the sample I gave but if you are troubleshooting something, just try the faulty connection.

We’re going to try to RDP to the public IP.  First we need the public IP domain name.  So in the resource group:

<a href="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image8.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb8.png" alt="image" width="640" height="285" border="0" /></a>

At the top of the pane we’ll find the DNS name that we can copy.

<a href="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image9.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb9.png" alt="image" width="640" height="170" border="0" /></a>

We can then paste it in an RDP window.

<a href="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image10.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb10.png" alt="image" width="640" height="405" border="0" /></a>

Trying to connect should fail and it should leave traces in the logs for us to analyse.
<h2>Analysis</h2>
We’ll have to wait 5-10 minutes for the logs to get in the storage account as this is done asynchronously.

Actually, a way to make sure to get clean logs is to delete the blob container and then try the RDP connection.  The blob container should reappear after 5-10 minutes.

To get the logs in the storage account we need some tool.  I use <a href="http://storageexplorer.com/" target="_blank">Microsoft Azure Storage Explorer</a>.

<a href="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image11.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb11.png" alt="image" width="640" height="235" border="0" /></a>

The blob container is called <em>insights-logs-networksecuritygrouprulecounter</em>.

The logs are hidden inside a complicated hierarchy allowing us to send all our diagnostic logs from all our NSGs over time there.

Basically, resourceId%3D / SUBSCRIPTIONS / &lt;Your subscription ID&gt; / RESOURCEGROUPS / NSG / PROVIDERS / MICROSOFT.NETWORK / NETWORKSECURITYGROUPS / we’ll see two folders:  SUBNETNSG &amp; VMNSG.  Those are our two NSGs.

If we dig under those two folders, we should find one file (or more if you’ve waited for a while).

Let’s copy those file with appropriate naming somewhere to analyse them.

Preferably, use a viewer / editor that understands JSON (I use Visual Studio).  If you use notepad…  you’re going to have fun.

If we look at the subnet NSG logs first and search for “RDP”, we’ll find this entry:

```JavaScript
    {
      "time": "2017-01-09T11:46:44.9090000Z",
      "systemId": "...",
      "category": "NetworkSecurityGroupRuleCounter",
      "resourceId": ".../RESOURCEGROUPS/NSG/PROVIDERS/MICROSOFT.NETWORK/NETWORKSECURITYGROUPS/SUBNETNSG",
      "operationName": "NetworkSecurityGroupCounters",
      "properties": {
        "vnetResourceGuid": "{50C7B76A-4B8F-481A-8029-73569E5C7D87}",
        "subnetPrefix": "10.0.1.0/24",
        "macAddress": "00-0D-3A-00-B6-B5",
        "primaryIPv4Address": "10.0.1.4",
        "ruleName": "UserRule_Allow-RDP-From-Everywhere",
        "direction": "In",
        "type": "allow",
        "matchedConnections": 0
      }
    },
```

The most interesting part is the <em>matchedConnections</em> property, which is zero because we didn’t achieve connections.

If we look in the VM logs, we’ll find this:

```JavaScript
    {
      "time": "2017-01-09T11:46:44.9110000Z",
      "systemId": "...",
      "category": "NetworkSecurityGroupRuleCounter",
      "resourceId": ".../RESOURCEGROUPS/NSG/PROVIDERS/MICROSOFT.NETWORK/NETWORKSECURITYGROUPS/VMNSG",
      "operationName": "NetworkSecurityGroupCounters",
      "properties": {
        "vnetResourceGuid": "{50C7B76A-4B8F-481A-8029-73569E5C7D87}",
        "subnetPrefix": "10.0.1.0/24",
        "macAddress": "00-0D-3A-00-B6-B5",
        "primaryIPv4Address": "10.0.1.4",
        "ruleName": "UserRule_Disallow-everything-else-Inbound",
        "direction": "In",
        "type": "block",
        "matchedConnections": 2
      }
    },
```

Where <em>matchedConnections</em> is 2 (because I tried twice).

So the logs tell us where the traffic when.

From here we could wonder why it hit that rule and look for a rule with a higher priority that allow RDP in, find none and conclude that’s our problem.
<h2>Trial &amp; Error</h2>
If the logs are not helping you, the last resort is to modify the NSG until you understand what is going on.

A way to do this is to create a rule “allow everything in from anywhere”, give it maximum priority.

If traffic still doesn’t go in, you have another problem than NSG, so go back to previous steps.

If traffic goes in, good.  Move that allow-everything rule down until you find which rule is blocking you.  You may have a lot of rules, in which case I would recommend a <a href="https://en.wikipedia.org/wiki/Dichotomic_search" target="_blank">dichotomic search algorithm</a>:  put your allow-everything rule in the middle of your “real rules”, if traffic passes, move the rule to the middle of the bottom half, otherwise, the middle of the top half, and so on.  This way, you’ll only need log(N) steps where N is your number of rules.
<h2>Summary</h2>
Troubleshooting NSGs can be difficult but here I highlighted a basic methodology to find your way around.

Diagnostic Logs help to give us insight about what is really going on although it can be tricky to work with.

In general, as with every debugging experience just apply the principle of Sherlock Holmes:

<em>Eliminate the impossible.  Whatever remains, however improbable, must be the truth.</em>

In terms of debugging, that means remove all the noise, all the fat and then some meat, until what remains is so simply that the truth will hit you.