---
title: Troubleshooting NSGs using Diagnostic Logs
date: 2017-01-09 07:32:42 -05:00
permalink: /2017/01/09/troubleshooting-nsgs-using-diagnostic-logs/
categories:
- Solution
tags:
- Networking
- Virtual Machines
---
<img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" src="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/marketing-man-person-communication2.jpg" width="379" height="253" align="right" border="0" />I’ve wrote about how to use Network Security Group (NSG) <a href="https://vincentlauzon.com/2015/12/21/using-network-security-groups-nsg-to-secure-network-access-to-an-environment/">before</a>.

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

[code language="JavaScript"]
{
  &quot;$schema&quot;: &quot;https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#&quot;,
  &quot;contentVersion&quot;: &quot;1.0.0.0&quot;,
  &quot;parameters&quot;: {
    &quot;VM Admin User Name&quot;: {
      &quot;defaultValue&quot;: &quot;myadmin&quot;,
      &quot;type&quot;: &quot;string&quot;
    },
    &quot;VM Admin Password&quot;: {
      &quot;defaultValue&quot;: null,
      &quot;type&quot;: &quot;securestring&quot;
    },
    &quot;Disk Storage Account Name&quot;: {
      &quot;defaultValue&quot;: &quot;&lt;your prefix&gt;vmpremium&quot;,
      &quot;type&quot;: &quot;string&quot;
    },
    &quot;Log Storage Account Name&quot;: {
      &quot;defaultValue&quot;: &quot;&lt;your prefix&gt;logstandard&quot;,
      &quot;type&quot;: &quot;string&quot;
    },
    &quot;VM Size&quot;: {
      &quot;defaultValue&quot;: &quot;Standard_DS2&quot;,
      &quot;type&quot;: &quot;string&quot;,
      &quot;allowedValues&quot;: [
        &quot;Standard_DS1&quot;,
        &quot;Standard_DS2&quot;,
        &quot;Standard_DS3&quot;
      ],
      &quot;metadata&quot;: {
        &quot;description&quot;: &quot;SKU of the VM.&quot;
      }
    },
    &quot;Public Domain Label&quot;: {
      &quot;type&quot;: &quot;string&quot;
    }
  },
  &quot;variables&quot;: {
    &quot;Vhds Container Name&quot;: &quot;vhds&quot;,
    &quot;VNet Name&quot;: &quot;MyVNet&quot;,
    &quot;Ip Range&quot;: &quot;10.0.1.0/24&quot;,
    &quot;Public IP Name&quot;: &quot;MyPublicIP&quot;,
    &quot;Public LB Name&quot;: &quot;PublicLB&quot;,
    &quot;Address Pool Name&quot;: &quot;addressPool&quot;,
    &quot;Subnet NSG Name&quot;: &quot;subnetNSG&quot;,
    &quot;VM NSG Name&quot;: &quot;vmNSG&quot;,
    &quot;RDP NAT Rule Name&quot;: &quot;RDP&quot;,
    &quot;NIC Name&quot;: &quot;MyNic&quot;,
    &quot;VM Name&quot;: &quot;MyVM&quot;
  },
  &quot;resources&quot;: [
    {
      &quot;type&quot;: &quot;Microsoft.Network/publicIPAddresses&quot;,
      &quot;name&quot;: &quot;[variables('Public IP Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Public IP&quot;
      },
      &quot;properties&quot;: {
        &quot;publicIPAllocationMethod&quot;: &quot;Dynamic&quot;,
        &quot;idleTimeoutInMinutes&quot;: 4,
        &quot;dnsSettings&quot;: {
          &quot;domainNameLabel&quot;: &quot;[parameters('Public Domain Label')]&quot;
        }
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/loadBalancers&quot;,
      &quot;name&quot;: &quot;[variables('Public LB Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Public Load Balancer&quot;
      },
      &quot;properties&quot;: {
        &quot;frontendIPConfigurations&quot;: [
          {
            &quot;name&quot;: &quot;LoadBalancerFrontEnd&quot;,
            &quot;comments&quot;: &quot;Front end of LB:  the IP address&quot;,
            &quot;properties&quot;: {
              &quot;publicIPAddress&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/publicIPAddresses/', variables('Public IP Name'))]&quot;
              }
            }
          }
        ],
        &quot;backendAddressPools&quot;: [
          {
            &quot;name&quot;: &quot;[variables('Address Pool Name')]&quot;
          }
        ],
        &quot;loadBalancingRules&quot;: [
          {
            &quot;name&quot;: &quot;Http&quot;,
            &quot;properties&quot;: {
              &quot;frontendIPConfiguration&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]&quot;
              },
              &quot;frontendPort&quot;: 80,
              &quot;backendPort&quot;: 80,
              &quot;enableFloatingIP&quot;: false,
              &quot;idleTimeoutInMinutes&quot;: 4,
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;loadDistribution&quot;: &quot;Default&quot;,
              &quot;backendAddressPool&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Address Pool Name'))]&quot;
              },
              &quot;probe&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/probes/TCP-Probe')]&quot;
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
        &quot;inboundNatRules&quot;: [
          {
            &quot;name&quot;: &quot;[variables('RDP NAT Rule Name')]&quot;,
            &quot;properties&quot;: {
              &quot;frontendIPConfiguration&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]&quot;
              },
              &quot;frontendPort&quot;: 3389,
              &quot;backendPort&quot;: 3389,
              &quot;protocol&quot;: &quot;Tcp&quot;
            }
          }
        ],
        &quot;outboundNatRules&quot;: [],
        &quot;inboundNatPools&quot;: []
      },
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/publicIPAddresses', variables('Public IP Name'))]&quot;
      ]
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/virtualNetworks&quot;,
      &quot;name&quot;: &quot;[variables('VNet Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2016-03-30&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;addressSpace&quot;: {
          &quot;addressPrefixes&quot;: [
            &quot;10.0.0.0/16&quot;
          ]
        },
        &quot;subnets&quot;: [
          {
            &quot;name&quot;: &quot;default&quot;,
            &quot;properties&quot;: {
              &quot;addressPrefix&quot;: &quot;[variables('Ip Range')]&quot;,
              &quot;networkSecurityGroup&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkSecurityGroups', variables('Subnet NSG Name'))]&quot;
              }
            }
          }
        ]
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/networkSecurityGroups', variables('Subnet NSG Name'))]&quot;
      ]
    },
    {
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;name&quot;: &quot;[variables('Subnet NSG Name')]&quot;,
      &quot;type&quot;: &quot;Microsoft.Network/networkSecurityGroups&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {},
      &quot;properties&quot;: {
        &quot;securityRules&quot;: [
          {
            &quot;name&quot;: &quot;Allow-HTTP-From-Internet&quot;,
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
          {
            &quot;name&quot;: &quot;Allow-RDP-From-Everywhere&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;3389&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 150,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
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
            &quot;name&quot;: &quot;Disallow-everything-else-Inbound&quot;,
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
            &quot;name&quot;: &quot;Disallow-everything-else-Outbound&quot;,
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
        &quot;subnets&quot;: []
      }
    },
    {
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;name&quot;: &quot;[variables('VM NSG Name')]&quot;,
      &quot;type&quot;: &quot;Microsoft.Network/networkSecurityGroups&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {},
      &quot;properties&quot;: {
        &quot;securityRules&quot;: [
          {
            &quot;name&quot;: &quot;Allow-HTTP-From-Internet&quot;,
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
            &quot;name&quot;: &quot;Disallow-everything-else-Inbound&quot;,
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
            &quot;name&quot;: &quot;Disallow-everything-else-Outbound&quot;,
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
        &quot;subnets&quot;: []
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/networkInterfaces&quot;,
      &quot;name&quot;: &quot;[variables('NIC Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2016-03-30&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;ipConfigurations&quot;: [
          {
            &quot;name&quot;: &quot;ipconfig&quot;,
            &quot;properties&quot;: {
              &quot;privateIPAllocationMethod&quot;: &quot;Dynamic&quot;,
              &quot;subnet&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name')), '/subnets/default')]&quot;
              },
              &quot;loadBalancerBackendAddressPools&quot;: [
                {
                  &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Address Pool Name'))]&quot;
                }
              ],
              &quot;loadBalancerInboundNatRules&quot;: [
                {
                  &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/inboundNatRules/', variables('RDP NAT Rule Name'))]&quot;
                }
              ]
            }
          }
        ],
        &quot;dnsSettings&quot;: {
          &quot;dnsServers&quot;: []
        },
        &quot;enableIPForwarding&quot;: false,
        &quot;networkSecurityGroup&quot;: {
          &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkSecurityGroups', variables('VM NSG Name'))]&quot;
        }
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name'))]&quot;,
        &quot;[resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name'))]&quot;
      ]
    },
    {
      &quot;type&quot;: &quot;Microsoft.Compute/virtualMachines&quot;,
      &quot;name&quot;: &quot;[variables('VM Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;hardwareProfile&quot;: {
          &quot;vmSize&quot;: &quot;[parameters('VM Size')]&quot;
        },
        &quot;storageProfile&quot;: {
          &quot;imageReference&quot;: {
            &quot;publisher&quot;: &quot;MicrosoftWindowsServer&quot;,
            &quot;offer&quot;: &quot;WindowsServer&quot;,
            &quot;sku&quot;: &quot;2012-R2-Datacenter&quot;,
            &quot;version&quot;: &quot;latest&quot;
          },
          &quot;osDisk&quot;: {
            &quot;name&quot;: &quot;[variables('VM Name')]&quot;,
            &quot;createOption&quot;: &quot;FromImage&quot;,
            &quot;vhd&quot;: {
              &quot;uri&quot;: &quot;[concat('https', '://', parameters('Disk Storage Account Name'), '.blob.core.windows.net', concat('/', variables('Vhds Container Name'),'/', variables('VM Name'), '-os-disk.vhd'))]&quot;
            },
            &quot;caching&quot;: &quot;ReadWrite&quot;
          },
          &quot;dataDisks&quot;: []
        },
        &quot;osProfile&quot;: {
          &quot;computerName&quot;: &quot;[variables('VM Name')]&quot;,
          &quot;adminUsername&quot;: &quot;[parameters('VM Admin User Name')]&quot;,
          &quot;windowsConfiguration&quot;: {
            &quot;provisionVMAgent&quot;: true,
            &quot;enableAutomaticUpdates&quot;: true
          },
          &quot;secrets&quot;: [],
          &quot;adminPassword&quot;: &quot;[parameters('VM Admin Password')]&quot;
        },
        &quot;networkProfile&quot;: {
          &quot;networkInterfaces&quot;: [
            {
              &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkInterfaces', concat(variables('NIC Name')))]&quot;
            }
          ]
        }
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Storage/storageAccounts', parameters('Disk Storage Account Name'))]&quot;,
        &quot;[resourceId('Microsoft.Network/networkInterfaces', variables('NIC Name'))]&quot;
      ]
    },
    {
      &quot;type&quot;: &quot;Microsoft.Storage/storageAccounts&quot;,
      &quot;name&quot;: &quot;[parameters('Disk Storage Account Name')]&quot;,
      &quot;sku&quot;: {
        &quot;name&quot;: &quot;Premium_LRS&quot;,
        &quot;tier&quot;: &quot;Premium&quot;
      },
      &quot;kind&quot;: &quot;Storage&quot;,
      &quot;apiVersion&quot;: &quot;2016-01-01&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {},
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: []
    },
    {
      &quot;type&quot;: &quot;Microsoft.Storage/storageAccounts&quot;,
      &quot;name&quot;: &quot;[parameters('Log Storage Account Name')]&quot;,
      &quot;sku&quot;: {
        &quot;name&quot;: &quot;Standard_LRS&quot;,
        &quot;tier&quot;: &quot;standard&quot;
      },
      &quot;kind&quot;: &quot;Storage&quot;,
      &quot;apiVersion&quot;: &quot;2016-01-01&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {},
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: []
    }
  ]
}
[/code]

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

<a href="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb.png" alt="image" width="640" height="417" border="0" /></a>

Scrolling all the way down on the NSG’s pane left menu, we select <em>Diagnostics Logs</em>.

<a href="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image1.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb1.png" alt="image" width="338" height="480" border="0" /></a>

The pane should look as follow since no diagnostics are enabled.  Let’s click on <em>Turn on diagnostics</em>.

<a href="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image2.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb2.png" alt="image" width="640" height="186" border="0" /></a>

We then turn it on.

<a href="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image3.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb3.png" alt="image" width="640" height="273" border="0" /></a>

For simplicity here, we’re going to use the <em>Archive to a storage account</em>.

<a href="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image4.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb4.png" alt="image" width="525" height="480" border="0" /></a>

We will configure the storage account to send the logs to.

<a href="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image5.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb5.png" alt="image" width="640" height="192" border="0" /></a>

For that, we’re selecting the standard account created by the template or whichever storage account you fancy.  Log Diagnostics will go and create a blob container for each category in the selected account.  The names a predefined (you can’t choose).

We select the <em>NetworkSecurityGroupRuleCounter</em> category.

<a href="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image6.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb6.png" alt="image" width="640" height="146" border="0" /></a>

And finally we hit the save button on the pane.

We’ll do the same thing with the VM NSG.

<a href="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image7.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb7.png" alt="image" width="640" height="391" border="0" /></a>
<h2>Creating logs</h2>
No we are going to try to get through our VM.  We are going to describe how to that with the sample I gave but if you are troubleshooting something, just try the faulty connection.

We’re going to try to RDP to the public IP.  First we need the public IP domain name.  So in the resource group:

<a href="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image8.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb8.png" alt="image" width="640" height="285" border="0" /></a>

At the top of the pane we’ll find the DNS name that we can copy.

<a href="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image9.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb9.png" alt="image" width="640" height="170" border="0" /></a>

We can then paste it in an RDP window.

<a href="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image10.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb10.png" alt="image" width="640" height="405" border="0" /></a>

Trying to connect should fail and it should leave traces in the logs for us to analyse.
<h2>Analysis</h2>
We’ll have to wait 5-10 minutes for the logs to get in the storage account as this is done asynchronously.

Actually, a way to make sure to get clean logs is to delete the blob container and then try the RDP connection.  The blob container should reappear after 5-10 minutes.

To get the logs in the storage account we need some tool.  I use <a href="http://storageexplorer.com/" target="_blank">Microsoft Azure Storage Explorer</a>.

<a href="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image11.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2017/1/troubleshooting-nsgs-using-diagnostic-logs/image_thumb11.png" alt="image" width="640" height="235" border="0" /></a>

The blob container is called <em>insights-logs-networksecuritygrouprulecounter</em>.

The logs are hidden inside a complicated hierarchy allowing us to send all our diagnostic logs from all our NSGs over time there.

Basically, resourceId%3D / SUBSCRIPTIONS / &lt;Your subscription ID&gt; / RESOURCEGROUPS / NSG / PROVIDERS / MICROSOFT.NETWORK / NETWORKSECURITYGROUPS / we’ll see two folders:  SUBNETNSG &amp; VMNSG.  Those are our two NSGs.

If we dig under those two folders, we should find one file (or more if you’ve waited for a while).

Let’s copy those file with appropriate naming somewhere to analyse them.

Preferably, use a viewer / editor that understands JSON (I use Visual Studio).  If you use notepad…  you’re going to have fun.

If we look at the subnet NSG logs first and search for “RDP”, we’ll find this entry:

[code language="JavaScript"]
    {
      &quot;time&quot;: &quot;2017-01-09T11:46:44.9090000Z&quot;,
      &quot;systemId&quot;: &quot;...&quot;,
      &quot;category&quot;: &quot;NetworkSecurityGroupRuleCounter&quot;,
      &quot;resourceId&quot;: &quot;.../RESOURCEGROUPS/NSG/PROVIDERS/MICROSOFT.NETWORK/NETWORKSECURITYGROUPS/SUBNETNSG&quot;,
      &quot;operationName&quot;: &quot;NetworkSecurityGroupCounters&quot;,
      &quot;properties&quot;: {
        &quot;vnetResourceGuid&quot;: &quot;{50C7B76A-4B8F-481A-8029-73569E5C7D87}&quot;,
        &quot;subnetPrefix&quot;: &quot;10.0.1.0/24&quot;,
        &quot;macAddress&quot;: &quot;00-0D-3A-00-B6-B5&quot;,
        &quot;primaryIPv4Address&quot;: &quot;10.0.1.4&quot;,
        &quot;ruleName&quot;: &quot;UserRule_Allow-RDP-From-Everywhere&quot;,
        &quot;direction&quot;: &quot;In&quot;,
        &quot;type&quot;: &quot;allow&quot;,
        &quot;matchedConnections&quot;: 0
      }
    },
[/code]

The most interesting part is the <em>matchedConnections</em> property, which is zero because we didn’t achieve connections.

If we look in the VM logs, we’ll find this:

[code language="JavaScript"]
    {
      &quot;time&quot;: &quot;2017-01-09T11:46:44.9110000Z&quot;,
      &quot;systemId&quot;: &quot;...&quot;,
      &quot;category&quot;: &quot;NetworkSecurityGroupRuleCounter&quot;,
      &quot;resourceId&quot;: &quot;.../RESOURCEGROUPS/NSG/PROVIDERS/MICROSOFT.NETWORK/NETWORKSECURITYGROUPS/VMNSG&quot;,
      &quot;operationName&quot;: &quot;NetworkSecurityGroupCounters&quot;,
      &quot;properties&quot;: {
        &quot;vnetResourceGuid&quot;: &quot;{50C7B76A-4B8F-481A-8029-73569E5C7D87}&quot;,
        &quot;subnetPrefix&quot;: &quot;10.0.1.0/24&quot;,
        &quot;macAddress&quot;: &quot;00-0D-3A-00-B6-B5&quot;,
        &quot;primaryIPv4Address&quot;: &quot;10.0.1.4&quot;,
        &quot;ruleName&quot;: &quot;UserRule_Disallow-everything-else-Inbound&quot;,
        &quot;direction&quot;: &quot;In&quot;,
        &quot;type&quot;: &quot;block&quot;,
        &quot;matchedConnections&quot;: 2
      }
    },
[/code]

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