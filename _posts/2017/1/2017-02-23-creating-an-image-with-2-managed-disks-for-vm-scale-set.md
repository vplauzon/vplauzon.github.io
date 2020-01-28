---
title: Creating an image with 2 Managed Disks for VM Scale Set
date: 2017-02-23 08:00:59 -08:00
permalink: /2017/02/23/creating-an-image-with-2-managed-disks-for-vm-scale-set/
categories:
- Solution
tags:
- Automation
- Virtual Machines
---
<strong>UPDATE (23-06-2017):  Fabio Hara, a colleague of mine from Brazil, has published the ARM template on <a href="https://github.com/fabioharams/VMSS-Custom-Windows-Managed-Disk">his GitHub</a>.  This makes it much easier to try the content of this article.  Thank you Fabio!</strong>

We talked about <a href="http://vincentlauzon.com/2017/02/20/azure-managed-disk-overview/">Managed Disks</a>, now let's use them.

Let’s create an image from an OS + Data disk &amp; create a Scale Set with that image.
<h3>Deploy ARM Template</h3>

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
    "VM Size": {
      "defaultValue": "Standard_DS4",
      "type": "string",
      "allowedValues": [
        "Standard_DS1",
        "Standard_DS2",
        "Standard_DS3",
        "Standard_DS4",
        "Standard_DS5"
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
    "frontIpRange": "10.0.1.0/24",
    "Public IP Name": "MyPublicIP",
    "Public LB Name": "PublicLB",
    "Front Address Pool Name": "frontPool",
    "Front NIC": "frontNic",
    "Front VM": "Demo-VM",
    "Front Availability Set Name": "frontAvailSet",
    "Private LB Name": "PrivateLB",
    "VNET Name": "Demo-VNet"
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
            "name": "front",
            "properties": {
              "addressPrefix": "[variables('frontIpRange')]",
              "networkSecurityGroup": {
                "id": "[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]"
              }
            }
          }
        ]
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]"
      ]
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
            "comments": "Front end of LB:  the IP address",
            "properties": {
              "publicIPAddress": {
                "id": "[resourceId('Microsoft.Network/publicIPAddresses/', variables('Public IP Name'))]"
              }
            }
          }
        ],
        "backendAddressPools": [
          {
            "name": "[variables('Front Address Pool Name')]"
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
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]"
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
            "name": "SSH-2-Primary",
            "properties": {
              "frontendIPConfiguration": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]"
              },
              "frontendPort": 22,
              "backendPort": 22,
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
      "apiVersion": "2015-06-15",
      "name": "frontNsg",
      "type": "Microsoft.Network/networkSecurityGroups",
      "location": "[resourceGroup().location]",
      "tags": {},
      "properties": {
        "securityRules": [
          {
            "name": "Allow-SSH-From-Everywhere",
            "properties": {
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "22",
              "sourceAddressPrefix": "*",
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
            "name": "Allow-to-8443",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "8443",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "Internet",
              "access": "Allow",
              "priority": 200,
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
              "priority": 300,
              "direction": "Outbound"
            }
          }
        ],
        "subnets": []
      }
    },
    {
      "type": "Microsoft.Network/networkInterfaces",
      "name": "[variables('Front NIC')]",
      "tags": {
        "displayName": "Front NICs"
      },
      "apiVersion": "2016-03-30",
      "location": "[resourceGroup().location]",
      "properties": {
        "ipConfigurations": [
          {
            "name": "ipconfig",
            "properties": {
              "privateIPAllocationMethod": "Dynamic",
              "subnet": {
                "id": "[concat(resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name')), '/subnets/front')]"
              },
              "loadBalancerBackendAddressPools": [
                {
                  "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]"
                }
              ],
              "loadBalancerInboundNatRules": [
                {
                  "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/inboundNatRules/SSH-2-Primary')]"
                }
              ]
            }
          }
        ],
        "dnsSettings": {
          "dnsServers": []
        },
        "enableIPForwarding": false
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name'))]",
        "[resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name'))]"
      ]
    },
    {
      "type": "Microsoft.Compute/disks",
      "name": "[concat(variables('Front VM'), '-data')]",
      "apiVersion": "2016-04-30-preview",
      "location": "[resourceGroup().location]",
      "properties": {
        "creationData": {
          "createOption": "Empty"
        },
        "accountType": "Premium_LRS",
        "diskSizeGB": 32
      }
    },
    {
      "type": "Microsoft.Compute/virtualMachines",
      "name": "[variables('Front VM')]",
      "tags": {
        "displayName": "Front VMs"
      },
      "apiVersion": "2016-04-30-preview",
      "location": "[resourceGroup().location]",
      "properties": {
        "availabilitySet": {
          "id": "[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]"
        },
        "hardwareProfile": {
          "vmSize": "[parameters('VM Size')]"
        },
        "storageProfile": {
          "imageReference": {
            "publisher": "OpenLogic",
            "offer": "CentOS",
            "sku": "7.3",
            "version": "latest"
          },
          "osDisk": {
            "name": "[variables('Front VM')]",
            "createOption": "FromImage",
            "caching": "ReadWrite"
          },
          "dataDisks": [
            {
              "lun": 2,
              "name": "[concat(variables('Front VM'), '-data')]",
              "createOption": "attach",
              "managedDisk": {
                "id": "[resourceId('Microsoft.Compute/disks', concat(variables('Front VM'), '-data'))]"
              },
              "caching": "Readonly"
            }
          ]
        },
        "osProfile": {
          "computerName": "[variables('Front VM')]",
          "adminUsername": "[parameters('VM Admin User Name')]",
          "adminPassword": "[parameters('VM Admin Password')]"
        },
        "networkProfile": {
          "networkInterfaces": [
            {
              "id": "[resourceId('Microsoft.Network/networkInterfaces', variables('Front NIC'))]"
            }
          ]
        }
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Network/networkInterfaces', variables('Front NIC'))]",
        "[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]",
        "[resourceId('Microsoft.Compute/disks', concat(variables('Front VM'), '-data'))]"
      ]
    },
    {
      "name": "[variables('Front Availability Set Name')]",
      "type": "Microsoft.Compute/availabilitySets",
      "location": "[resourceGroup().location]",
      "apiVersion": "2016-04-30-preview",
      "tags": {
        "displayName": "FrontAvailabilitySet"
      },
      "properties": {
        "platformUpdateDomainCount": 5,
        "platformFaultDomainCount": 3,
        "managed": true
      },
      "dependsOn": []
    }
  ]
}
```

<ol>
 	<li>We use the resource group named <i>md-demo-image</i></li>
 	<li>This deploys a single Linux VM into a managed availability set using a premium managed disk</li>
 	<li>The VM has both OS &amp; a data disk</li>
 	<li>The deployment <b>takes a few minutes</b></li>
</ol>
<h3>Customize VM</h3>
<ol>
 	<li>Login to the VM</li>
</ol>
<ol>
 	<li>We suggest using Putty tool with SSH (SSH port is opened on NSG)</li>
 	<li>Look at <i>MyPublicIP </i>to find the DNS of the public IP in order to SSH to it</li>
</ol>
<ul>
 	<li>First, let’s initialize the data disk by using the procedure described in <a href="https://docs.microsoft.com/en-ca/azure/virtual-machines/linux/add-disk#connect-to-the-linux-vm-to-mount-the-new-disk">https://docs.microsoft.com/en-ca/azure/virtual-machines/linux/add-disk#connect-to-the-linux-vm-to-mount-the-new-disk</a></li>
</ul>
<ol>
 	<li>The data disk is LUN-2 (it should be /dev/sdc)</li>
 	<li>We will mount it to /data</li>
 	<li>Write the mount point permanently in /etc/fstab</li>
</ol>
<ul>
 	<li>In the bash shell, type
cd /data
sudo touch mydata
ls</li>
 	<li>We just created a file on the data disk</li>
</ul>
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
<h3>Create Image</h3>
You can read about details of this procedure at <a href="https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-linux-capture-image">https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-linux-capture-image</a> &amp; <a href="https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-capture-image-resource">https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-capture-image-resource</a>.
<ol>
 	<li>In bash shell, type
sudo waagent -deprovision+user -force</li>
 	<li>This de-provisions the VM itself</li>
 	<li>In PowerShell, type
$rgName = "md-demo-image"
$imageName = "Demo-VM-Image"
$vm = Get-AzureRmVM -ResourceGroupName $rgName
Stop-AzureRmVM -ResourceGroupName $rgName -Name $vm.Name -Force</li>
 	<li>This will stop the VM</li>
 	<li>In PowerShell, type
Set-AzureRmVm -ResourceGroupName $rgName -Name $vm.Name -Generalized</li>
 	<li>This generalizes the VM</li>
 	<li>In PowerShell, type
$imageConfig = New-AzureRmImageConfig -Location $vm.Location -SourceVirtualMachineId $vm.Id
New-AzureRmImage -ImageName $imageName -ResourceGroupName $rgName -Image $imageConfig</li>
 	<li>This creates an image resource containing both the OS &amp; data disks</li>
 	<li>We can see the image in the portal and validate it has two disks in it</li>
</ol>
<h3>Clean up VM</h3>
In order to install a Scale Set in the same availability set, we need to remove the VM.
<ol>
 	<li>In PowerShell, type
Remove-AzureRmVM -ResourceGroupName $rgName -Name $vm.Name -Force
Remove-AzureRmNetworkInterface -ResourceGroupName $rgName -Name frontNic -Force
Remove-AzureRmAvailabilitySet -ResourceGroupName $rgName -Name frontAvailSet -Force</li>
 	<li>Optionally, we can remove the disks
Remove-AzureRmDisk -ResourceGroupName $rgName -DiskName Demo-VM -Force
Remove-AzureRmDisk -ResourceGroupName $rgName -DiskName Demo-VM-data -Force</li>
 	<li>Remove-AzureRmLoadBalancer -ResourceGroupName $rgName -Name PublicLB -Force</li>
</ol>
<h3>Deploy Scale Set</h3>

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
    "Instance Count": {
      "defaultValue": 3,
      "type": "int"
    },
    "VM Size": {
      "defaultValue": "Standard_DS4",
      "type": "string",
      "allowedValues": [
        "Standard_DS1",
        "Standard_DS2",
        "Standard_DS3",
        "Standard_DS4",
        "Standard_DS5"
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
    "frontIpRange": "10.0.1.0/24",
    "Public IP Name": "MyPublicIP",
    "Public LB Name": "PublicLB",
    "Front Address Pool Name": "frontPool",
    "Front Nat Pool Name": "frontNatPool",
    "VNET Name": "Demo-VNet",
    "NIC Prefix": "Nic",
    "Scale Set Name": "Demo-ScaleSet",
    "Image Name": "Demo-VM-Image",
    "VM Prefix": "Demo-VM",
    "IP Config Name": "ipConfig"
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
            "name": "front",
            "properties": {
              "addressPrefix": "[variables('frontIpRange')]",
              "networkSecurityGroup": {
                "id": "[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]"
              }
            }
          }
        ]
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]"
      ]
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
            "comments": "Front end of LB:  the IP address",
            "properties": {
              "publicIPAddress": {
                "id": "[resourceId('Microsoft.Network/publicIPAddresses/', variables('Public IP Name'))]"
              }
            }
          }
        ],
        "backendAddressPools": [
          {
            "name": "[variables('Front Address Pool Name')]"
          }
        ],
        "loadBalancingRules": [],
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
        "inboundNatPools": [
          {
            "name": "[variables('Front Nat Pool Name')]",
            "properties": {
              "frontendIPConfiguration": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/loadBalancerFrontEnd')]"
              },
              "protocol": "tcp",
              "frontendPortRangeStart": 5000,
              "frontendPortRangeEnd": 5200,
              "backendPort": 22
            }
          }
        ]
      },
      "dependsOn": [
        "[resourceId('Microsoft.Network/publicIPAddresses', variables('Public IP Name'))]"
      ]
    },
    {
      "apiVersion": "2015-06-15",
      "name": "frontNsg",
      "type": "Microsoft.Network/networkSecurityGroups",
      "location": "[resourceGroup().location]",
      "tags": {},
      "properties": {
        "securityRules": [
          {
            "name": "Allow-SSH-From-Everywhere",
            "properties": {
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "22",
              "sourceAddressPrefix": "*",
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
            "name": "Allow-to-8443",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "8443",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "Internet",
              "access": "Allow",
              "priority": 200,
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
              "priority": 300,
              "direction": "Outbound"
            }
          }
        ],
        "subnets": []
      }
    },
    {
      "type": "Microsoft.Compute/virtualMachineScaleSets",
      "name": "[variables('Scale Set Name')]",
      "location": "[resourceGroup().location]",
      "apiVersion": "2016-04-30-preview",
      "dependsOn": [
        "[concat('Microsoft.Network/loadBalancers/', variables('Public LB Name'))]",
        "[concat('Microsoft.Network/virtualNetworks/', variables('VNET Name'))]"
      ],
      "sku": {
        "name": "[parameters('VM Size')]",
        "tier": "Standard",
        "capacity": "[parameters('Instance Count')]"
      },
      "properties": {
        "overprovision": "true",
        "upgradePolicy": {
          "mode": "Manual"
        },
        "virtualMachineProfile": {
          "storageProfile": {
            "osDisk": {
              "createOption": "FromImage",
              "managedDisk": {
                "storageAccountType": "Premium_LRS"
              }
            },
            "imageReference": {
              "id": "[resourceId('Microsoft.Compute/images', variables('Image Name'))]"
            },
            "dataDisks": [
              {
                "createOption": "FromImage",
                "lun": "2",
                "managedDisk": {
                  "storageAccountType": "Premium_LRS"
                }
              }
            ]
          },
          "osProfile": {
            "computerNamePrefix": "[variables('VM Prefix')]",
            "adminUsername": "[parameters('VM Admin User Name')]",
            "adminPassword": "[parameters('VM Admin Password')]"
          },
          "networkProfile": {
            "networkInterfaceConfigurations": [
              {
                "name": "[variables('NIC Prefix')]",
                "properties": {
                  "primary": "true",
                  "ipConfigurations": [
                    {
                      "name": "[variables('IP Config Name')]",
                      "properties": {
                        "subnet": {
                          "id": "[concat('/subscriptions/', subscription().subscriptionId,'/resourceGroups/', resourceGroup().name, '/providers/Microsoft.Network/virtualNetworks/', variables('VNET Name'), '/subnets/front')]"
                        },
                        "loadBalancerBackendAddressPools": [
                          {
                            "id": "[concat('/subscriptions/', subscription().subscriptionId,'/resourceGroups/', resourceGroup().name, '/providers/Microsoft.Network/loadBalancers/', variables('Public LB Name'), '/backendAddressPools/', variables('Front Address Pool Name'))]"
                          }
                        ],
                        "loadBalancerInboundNatPools": [
                          {
                            "id": "[concat('/subscriptions/', subscription().subscriptionId,'/resourceGroups/', resourceGroup().name, '/providers/Microsoft.Network/loadBalancers/', variables('Public LB Name'), '/inboundNatPools/', variables('Front Nat Pool Name'))]"
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    }
  ]
}
```

You can choose the number of instances, by default there are 3
<h3>Validate Instance</h3>
<ol>
 	<li>Connect to the first instance available using SSH on port 5000 of the public IP</li>
 	<li>SSH ports are NATed from port 5000 up to back-end port 22</li>
 	<li>In the bash shell type
ls /data</li>
 	<li>You should see “mydata”, hence the image carried both the os &amp; data disks</li>
</ol>
<h3>Clean up</h3>
We won’t be using the resource groups we have created so we can delete them

In ISE, type Remove-AzureRmResourceGroup -Name md-demo-image -Force