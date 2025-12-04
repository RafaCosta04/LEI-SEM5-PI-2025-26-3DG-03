using System;
using System.Collections.Generic;

namespace Application.DTO;

public class RebalancingDTO
{
    public List<RebalancingEntryDTO> InitialEntries { get; set; }

    public List<RebalancingEntryDTO> RebalancedEntries { get; set; }

    public RebalancingDTO(
        List<RebalancingEntryDTO> initialEntries,
        List<RebalancingEntryDTO> rebalancedEntries
        )
    {
        InitialEntries = initialEntries ?? new List<RebalancingEntryDTO>();
        RebalancedEntries = rebalancedEntries ?? new List<RebalancingEntryDTO>();
    }
}