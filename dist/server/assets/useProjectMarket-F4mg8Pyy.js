import { s as useQuery } from "./router-8qflvY1T.js";
import { g as getProjects } from "./projects-Ca8yAMNt.js";
function useProjectMarket(projectId) {
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects()
  });
  return projectsQuery.data?.find((project) => project.id === projectId);
}
export {
  useProjectMarket as u
};
