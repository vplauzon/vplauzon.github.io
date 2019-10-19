---
title: Taking a snapshot of a Managed Disk
date: 2017-02-22 11:00:56 -05:00
permalink: /2017/02/22/taking-a-snapshot-of-a-managed-disk/
categories:
- Solution
tags:
- Virtual Machines
---
We talked about <a href="http://vincentlauzon.com/2017/02/20/azure-managed-disk-overview/">Managed Disks</a>, now let's use them.

Let’s snapshot a Managed Disk and restore the snapshot on another VM.
<h3>Deploy ARM Template</h3>

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
    &quot;VM Size&quot;: {
      &quot;defaultValue&quot;: &quot;Standard_DS4&quot;,
      &quot;type&quot;: &quot;string&quot;,
      &quot;allowedValues&quot;: [
        &quot;Standard_DS1&quot;,
        &quot;Standard_DS2&quot;,
        &quot;Standard_DS3&quot;,
        &quot;Standard_DS4&quot;,
        &quot;Standard_DS5&quot;
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
    &quot;frontIpRange&quot;: &quot;10.0.1.0/24&quot;,
    &quot;Public IP Name&quot;: &quot;MyPublicIP&quot;,
    &quot;Public LB Name&quot;: &quot;PublicLB&quot;,
    &quot;Front Address Pool Name&quot;: &quot;frontPool&quot;,
    &quot;Front NIC&quot;: &quot;frontNic&quot;,
    &quot;Front VM&quot;: &quot;Demo-VM&quot;,
    &quot;Front Availability Set Name&quot;: &quot;frontAvailSet&quot;,
    &quot;Private LB Name&quot;: &quot;PrivateLB&quot;,
    &quot;VNET Name&quot;: &quot;Demo-VNet&quot;
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
            &quot;name&quot;: &quot;front&quot;,
            &quot;properties&quot;: {
              &quot;addressPrefix&quot;: &quot;[variables('frontIpRange')]&quot;,
              &quot;networkSecurityGroup&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]&quot;
              }
            }
          }
        ]
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]&quot;
      ]
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
            &quot;comments&quot;: &quot;Front end of LB:  the IP address&quot;,
            &quot;properties&quot;: {
              &quot;publicIPAddress&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/publicIPAddresses/', variables('Public IP Name'))]&quot;
              }
            }
          }
        ],
        &quot;backendAddressPools&quot;: [
          {
            &quot;name&quot;: &quot;[variables('Front Address Pool Name')]&quot;
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
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]&quot;
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
            &quot;name&quot;: &quot;SSH-2-Primary&quot;,
            &quot;properties&quot;: {
              &quot;frontendIPConfiguration&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]&quot;,
              },
              &quot;frontendPort&quot;: 22,
              &quot;backendPort&quot;: 22,
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
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;name&quot;: &quot;frontNsg&quot;,
      &quot;type&quot;: &quot;Microsoft.Network/networkSecurityGroups&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {},
      &quot;properties&quot;: {
        &quot;securityRules&quot;: [
          {
            &quot;name&quot;: &quot;Allow-SSH-From-Everywhere&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;22&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
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
            &quot;name&quot;: &quot;Allow-to-8443&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;8443&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;Internet&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 200,
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
              &quot;priority&quot;: 300,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          }
        ],
        &quot;subnets&quot;: []
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/networkInterfaces&quot;,
      &quot;name&quot;: &quot;[variables('Front NIC')]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Front NICs&quot;
      },
      &quot;apiVersion&quot;: &quot;2016-03-30&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;ipConfigurations&quot;: [
          {
            &quot;name&quot;: &quot;ipconfig&quot;,
            &quot;properties&quot;: {
              &quot;privateIPAllocationMethod&quot;: &quot;Dynamic&quot;,
              &quot;subnet&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name')), '/subnets/front')]&quot;
              },
              &quot;loadBalancerBackendAddressPools&quot;: [
                {
                  &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]&quot;
                }
              ],
              &quot;loadBalancerInboundNatRules&quot;: [
                {
                  &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/inboundNatRules/SSH-2-Primary')]&quot;
                }
              ]
            }
          }
        ],
        &quot;dnsSettings&quot;: {
          &quot;dnsServers&quot;: []
        },
        &quot;enableIPForwarding&quot;: false
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name'))]&quot;,
        &quot;[resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name'))]&quot;
      ]
    },
    {
      &quot;type&quot;: &quot;Microsoft.Compute/virtualMachines&quot;,
      &quot;name&quot;: &quot;[variables('Front VM')]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Front VMs&quot;
      },
      &quot;apiVersion&quot;: &quot;2016-04-30-preview&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;availabilitySet&quot;: {
          &quot;id&quot;: &quot;[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]&quot;
        },
        &quot;hardwareProfile&quot;: {
          &quot;vmSize&quot;: &quot;[parameters('VM Size')]&quot;
        },
        &quot;storageProfile&quot;: {
          &quot;imageReference&quot;: {
            &quot;publisher&quot;: &quot;OpenLogic&quot;,
            &quot;offer&quot;: &quot;CentOS&quot;,
            &quot;sku&quot;: &quot;7.3&quot;,
            &quot;version&quot;: &quot;latest&quot;
          },
          &quot;osDisk&quot;: {
            &quot;name&quot;: &quot;[variables('Front VM')]&quot;,
            &quot;createOption&quot;: &quot;FromImage&quot;,
            &quot;caching&quot;: &quot;ReadWrite&quot;
          },
          &quot;dataDisks&quot;: []
        },
        &quot;osProfile&quot;: {
          &quot;computerName&quot;: &quot;[variables('Front VM')]&quot;,
          &quot;adminUsername&quot;: &quot;[parameters('VM Admin User Name')]&quot;,
          &quot;adminPassword&quot;: &quot;[parameters('VM Admin Password')]&quot;
        },
        &quot;networkProfile&quot;: {
          &quot;networkInterfaces&quot;: [
            {
              &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkInterfaces', variables('Front NIC'))]&quot;
            }
          ]
        }
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/networkInterfaces', variables('Front NIC'))]&quot;,
        &quot;[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]&quot;
      ]
    },
    {
      &quot;name&quot;: &quot;[variables('Front Availability Set Name')]&quot;,
      &quot;type&quot;: &quot;Microsoft.Compute/availabilitySets&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;apiVersion&quot;: &quot;2016-04-30-preview&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;FrontAvailabilitySet&quot;
      },
      &quot;properties&quot;: {
        &quot;platformUpdateDomainCount&quot;: 5,
        &quot;platformFaultDomainCount&quot;: 3,
        &quot;managed&quot;: true
      },
      &quot;dependsOn&quot;: []
    }
  ]
}
[/code]

We used the resource group named <i>md-demo-snapshot</i>.

This deploys a single Linux VM into a managed availability set using a premium managed disk

The deployment <b>takes a few minutes</b>
<h3>Customize VM</h3>
<ol>
 	<li>Login to the VM</li>
 	<li>We suggest using Putty tool with SSH (SSH port is opened on NSG)</li>
 	<li>Look at <i>MyPublicIP </i>to find the DNS of the public IP in order to SSH to it</li>
 	<li>In the bash shell type <br />
touch myfile</li>
 	<li>This simply creates a file in the home directory of the admin user</li>
</ol>
&nbsp;
<h3>Login into ISE</h3>
<ol>
 	<li>Open up PowerShell ISE</li>
 	<li>Type Add-AzureRmAccount</li>
 	<li>Enter your credentials ; those credentials should be the same you are using to log into the Azure Portal</li>
 	<li>If you have more than one subscriptions</li>
</ol>
<ol>
 	<li>Type Get-AzureRmSubscription</li>
 	<li>This should list all subscriptions you have access (even partial) to</li>
 	<li>Select the <i>SubscriptionId</i> (a GUID) of the subscription you want to use</li>
 	<li>Type Select-AzureRmSubscription -SubscriptionId &lt;SubscriptionId&gt;
<i>&lt;SubscriptionId&gt;</i> is the value you just selected</li>
 	<li>This will select the specified subscription as the “current one”, i.e. future queries will be done against that subscription</li>
</ol>
<h3>Create Snapshot</h3>
<ol>
 	<li>In PowerShell ISE, type
$rgName = 'md-demo-snapshot' # or the Resource Group name you used
$disk = Get-AzureRmDisk -ResourceGroupName $rgName
$config = New-AzureRmSnapshotConfig -SourceUri $disk.Id -CreateOption Copy -Location $disk.Location
$snapshot = New-AzureRmSnapshot -Snapshot $config -SnapshotName ($disk.Name+'-snapshot') -ResourceGroupName $rgName</li>
 	<li>This creates a snapshot of the managed disk</li>
 	<li>Snapshots are stored in standard storage and are full copies of the disk (incremental isn’t supported yet)</li>
</ol>
<h3>Look at snapshot</h3>
<ol>
 	<li>In the portal, go to the resource group</li>
 	<li>Select the snapshot resource
<a href="/assets/2017/2/taking-a-snapshot-of-a-managed-disk/clip_image0021.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image002" src="/assets/2017/2/taking-a-snapshot-of-a-managed-disk/clip_image002_thumb1.jpg" alt="clip_image002" border="0" /></a></li>
 	<li>Notice the storage type is standard LRS</li>
</ol>
<h3>Change the existing VM</h3>
<ol>
 	<li>Back in the SSH session, type
touch myotherfile</li>
 	<li>We do this simply to differentiate from the snapshot</li>
</ol>
<h3>Deploy VM from snapshot</h3>

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
    &quot;VM Size&quot;: {
      &quot;defaultValue&quot;: &quot;Standard_DS4&quot;,
      &quot;type&quot;: &quot;string&quot;,
      &quot;allowedValues&quot;: [
        &quot;Standard_DS1&quot;,
        &quot;Standard_DS2&quot;,
        &quot;Standard_DS3&quot;,
        &quot;Standard_DS4&quot;,
        &quot;Standard_DS5&quot;
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
    &quot;frontIpRange&quot;: &quot;10.0.1.0/24&quot;,
    &quot;Public IP Name&quot;: &quot;MyPublicIP&quot;,
    &quot;Public LB Name&quot;: &quot;PublicLB&quot;,
    &quot;Front Address Pool Name&quot;: &quot;frontPool&quot;,
    &quot;Front NIC&quot;: &quot;frontNic&quot;,
    &quot;Front NIC Clone&quot;: &quot;frontNic-Clone&quot;,
    &quot;Front VM&quot;: &quot;Demo-VM&quot;,
    &quot;Front VM Clone&quot;: &quot;Demo-VM-Clone&quot;,
    &quot;Front Availability Set Name&quot;: &quot;frontAvailSet&quot;,
    &quot;VNET Name&quot;: &quot;Demo-VNet&quot;
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
            &quot;name&quot;: &quot;front&quot;,
            &quot;properties&quot;: {
              &quot;addressPrefix&quot;: &quot;[variables('frontIpRange')]&quot;,
              &quot;networkSecurityGroup&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]&quot;
              }
            }
          }
        ]
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]&quot;
      ]
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
            &quot;comments&quot;: &quot;Front end of LB:  the IP address&quot;,
            &quot;properties&quot;: {
              &quot;publicIPAddress&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/publicIPAddresses/', variables('Public IP Name'))]&quot;
              }
            }
          }
        ],
        &quot;backendAddressPools&quot;: [
          {
            &quot;name&quot;: &quot;[variables('Front Address Pool Name')]&quot;
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
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]&quot;
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
            &quot;name&quot;: &quot;SSH-2-Primary&quot;,
            &quot;properties&quot;: {
              &quot;frontendIPConfiguration&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]&quot;
              },
              &quot;frontendPort&quot;: 22,
              &quot;backendPort&quot;: 22,
              &quot;protocol&quot;: &quot;Tcp&quot;
            }
          },
          {
            &quot;name&quot;: &quot;SSH-2-Secondary&quot;,
            &quot;properties&quot;: {
              &quot;frontendIPConfiguration&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]&quot;
              },
              &quot;frontendPort&quot;: 5000,
              &quot;backendPort&quot;: 22,
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
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;name&quot;: &quot;frontNsg&quot;,
      &quot;type&quot;: &quot;Microsoft.Network/networkSecurityGroups&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {},
      &quot;properties&quot;: {
        &quot;securityRules&quot;: [
          {
            &quot;name&quot;: &quot;Allow-SSH-From-Everywhere&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;22&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
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
            &quot;name&quot;: &quot;Allow-to-8443&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;8443&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;Internet&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 200,
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
              &quot;priority&quot;: 300,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          }
        ],
        &quot;subnets&quot;: []
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/networkInterfaces&quot;,
      &quot;name&quot;: &quot;[variables('Front NIC')]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Front NIC&quot;
      },
      &quot;apiVersion&quot;: &quot;2016-03-30&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;ipConfigurations&quot;: [
          {
            &quot;name&quot;: &quot;ipconfig&quot;,
            &quot;properties&quot;: {
              &quot;privateIPAllocationMethod&quot;: &quot;Dynamic&quot;,
              &quot;subnet&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name')), '/subnets/front')]&quot;
              },
              &quot;loadBalancerBackendAddressPools&quot;: [
                {
                  &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]&quot;
                }
              ],
              &quot;loadBalancerInboundNatRules&quot;: [
                {
                  &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/inboundNatRules/SSH-2-Primary')]&quot;
                }
              ]
            }
          }
        ],
        &quot;dnsSettings&quot;: {
          &quot;dnsServers&quot;: []
        },
        &quot;enableIPForwarding&quot;: false
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name'))]&quot;,
        &quot;[resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name'))]&quot;
      ]
    },
    {
      &quot;type&quot;: &quot;Microsoft.Compute/virtualMachines&quot;,
      &quot;name&quot;: &quot;[variables('Front VM')]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Front VM&quot;
      },
      &quot;apiVersion&quot;: &quot;2016-04-30-preview&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;availabilitySet&quot;: {
          &quot;id&quot;: &quot;[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]&quot;
        },
        &quot;hardwareProfile&quot;: {
          &quot;vmSize&quot;: &quot;[parameters('VM Size')]&quot;
        },
        &quot;storageProfile&quot;: {
          &quot;imageReference&quot;: {
            &quot;publisher&quot;: &quot;OpenLogic&quot;,
            &quot;offer&quot;: &quot;CentOS&quot;,
            &quot;sku&quot;: &quot;7.3&quot;,
            &quot;version&quot;: &quot;latest&quot;
          },
          &quot;osDisk&quot;: {
            &quot;name&quot;: &quot;[variables('Front VM')]&quot;,
            &quot;createOption&quot;: &quot;FromImage&quot;,
            &quot;caching&quot;: &quot;ReadWrite&quot;
          },
          &quot;dataDisks&quot;: []
        },
        &quot;osProfile&quot;: {
          &quot;computerName&quot;: &quot;[variables('Front VM')]&quot;,
          &quot;adminUsername&quot;: &quot;[parameters('VM Admin User Name')]&quot;,
          &quot;adminPassword&quot;: &quot;[parameters('VM Admin Password')]&quot;
        },
        &quot;networkProfile&quot;: {
          &quot;networkInterfaces&quot;: [
            {
              &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkInterfaces', variables('Front NIC'))]&quot;
            }
          ]
        }
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[variables('Front NIC')]&quot;,
        &quot;[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]&quot;
      ]
    },
    {
      &quot;name&quot;: &quot;[variables('Front Availability Set Name')]&quot;,
      &quot;type&quot;: &quot;Microsoft.Compute/availabilitySets&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;apiVersion&quot;: &quot;2016-04-30-preview&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;FrontAvailabilitySet&quot;
      },
      &quot;properties&quot;: {
        &quot;platformUpdateDomainCount&quot;: 5,
        &quot;platformFaultDomainCount&quot;: 3,
        &quot;managed&quot;: true
      },
      &quot;dependsOn&quot;: []
    },
    {
      &quot;name&quot;: &quot;[variables('Front VM Clone')]&quot;,
      &quot;type&quot;: &quot;Microsoft.Compute/disks&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;apiVersion&quot;: &quot;2016-04-30-preview&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Clone Disk&quot;
      },
      &quot;properties&quot;: {
        &quot;creationData&quot;: {
          &quot;createOption&quot;: &quot;copy&quot;,
          &quot;sourceUri&quot;: &quot;[resourceId('Microsoft.Compute/snapshots', concat(variables('Front VM'), '-snapshot'))]&quot;
        },
        &quot;accountType&quot;: &quot;Premium_LRS&quot;,
        &quot;diskSizeGB&quot;: 127,
        &quot;osType&quot;: &quot;&quot;
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/networkInterfaces&quot;,
      &quot;name&quot;: &quot;[variables('Front NIC Clone')]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Front NIC Clone&quot;
      },
      &quot;apiVersion&quot;: &quot;2016-03-30&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;ipConfigurations&quot;: [
          {
            &quot;name&quot;: &quot;ipconfig&quot;,
            &quot;properties&quot;: {
              &quot;privateIPAllocationMethod&quot;: &quot;Dynamic&quot;,
              &quot;subnet&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name')), '/subnets/front')]&quot;
              },
              &quot;loadBalancerBackendAddressPools&quot;: [
                {
                  &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]&quot;
                }
              ],
              &quot;loadBalancerInboundNatRules&quot;: [
                {
                  &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/inboundNatRules/SSH-2-Secondary')]&quot;
                }
              ]
            }
          }
        ],
        &quot;dnsSettings&quot;: {
          &quot;dnsServers&quot;: []
        },
        &quot;enableIPForwarding&quot;: false
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name'))]&quot;,
        &quot;[resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name'))]&quot;
      ]
    },
    {
      &quot;type&quot;: &quot;Microsoft.Compute/virtualMachines&quot;,
      &quot;name&quot;: &quot;[variables('Front VM Clone')]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Front VM Clone&quot;
      },
      &quot;apiVersion&quot;: &quot;2016-04-30-preview&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;availabilitySet&quot;: {
          &quot;id&quot;: &quot;[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]&quot;
        },
        &quot;hardwareProfile&quot;: {
          &quot;vmSize&quot;: &quot;[parameters('VM Size')]&quot;
        },
        &quot;storageProfile&quot;: {
          &quot;osDisk&quot;: {
            &quot;name&quot;: &quot;[variables('Front VM Clone')]&quot;,
            &quot;createOption&quot;: &quot;attach&quot;,
            &quot;managedDisk&quot;: {
              &quot;id&quot;: &quot;[resourceId('Microsoft.Compute/disks', variables('Front VM Clone'))]&quot;
            },
            &quot;osType&quot;: &quot;Linux&quot;,
            &quot;caching&quot;: &quot;ReadWrite&quot;
          },
          &quot;dataDisks&quot;: []
        },
        &quot;networkProfile&quot;: {
          &quot;networkInterfaces&quot;: [
            {
              &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkInterfaces', variables('Front NIC Clone'))]&quot;
            }
          ]
        }
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]&quot;,
        &quot;[resourceId('Microsoft.Network/networkInterfaces', variables('Front NIC Clone'))]&quot;,
        &quot;[resourceId('Microsoft.Compute/disks', variables('Front VM Clone'))]&quot;
      ]
    }
  ]
}
[/code]


Deploy it in the same resource group, with the same arguments
<h3>Validate VM</h3>
<ol>
 	<li>Login to the Clone VM</li>
 	<li>We suggest using Putty tool with SSH (SSH port is opened on NSG)</li>
 	<li>Look at <i>MyPublicIP </i>to find the DNS of the public IP in order to SSH to it</li>
 	<li>Use the port 5000 as that is the port NAT to the SSH port of the clone VM</li>
 	<li>In the bash shell type <br />
ls</li>
 	<li>You should see “myfile”, hence the snapshot of the first customization</li>
</ol>
&nbsp;
<h3>Exercise</h3>
Try do the same with data disks.
<h3>Clean up</h3>
We won’t be using the resource groups we have created so we can delete them

In ISE, type Remove-AzureRmResourceGroup -Name md-demo-snapshot -Force